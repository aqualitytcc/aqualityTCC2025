<?php
/**
 * API para Receber Dados dos Sensores ESP32 - Water Sense Mobile
 * Endpoint principal para o dispositivo A-Quality enviar leituras
 * Adaptado para a estrutura do banco existente
 */

require_once __DIR__ . '/../config.php';

// Configura CORS e headers
configurar_cors();

/**
 * Verifica se o método da requisição é POST
 */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido. Use POST.');
}

// Conecta ao banco de dados
$conexao = conectar_banco();
if (!$conexao) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.');
}

// Recebe os dados JSON do ESP32
$dados_json = file_get_contents("php://input");
$dados = json_decode($dados_json, true);

// Log da requisição recebida para debug
log_error("Dados recebidos do sensor ESP32", [
    'dados_brutos' => $dados_json,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'desconhecido',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'desconhecido'
]);

// Validação dos dados obrigatórios
if (!$dados) {
    enviar_resposta(400, 'erro', 'Dados JSON inválidos.');
}

$campos_obrigatorios = ['codigo_dispositivo', 'ph', 'turbidez', 'condutividade', 'temperatura'];
foreach ($campos_obrigatorios as $campo) {
    if (!isset($dados[$campo])) {
        enviar_resposta(400, 'erro', "Campo obrigatório ausente: $campo");
    }
}

// Extrai e valida os dados dos sensores
$codigo_dispositivo = $dados['codigo_dispositivo'];
$ph = floatval($dados['ph']);
$turbidez = floatval($dados['turbidez']);
$condutividade = floatval($dados['condutividade']);
$temperatura = floatval($dados['temperatura']);

// Validação dos ranges dos sensores (valores seguros)
if ($ph < 0 || $ph > 14) {
    enviar_resposta(400, 'erro', 'Valor de pH inválido (deve estar entre 0 e 14)');
}

if ($turbidez < 0 || $turbidez > 1000) {
    enviar_resposta(400, 'erro', 'Valor de turbidez inválido (deve estar entre 0 e 1000 NTU)');
}

if ($condutividade < 0 || $condutividade > 100) {
    enviar_resposta(400, 'erro', 'Valor de condutividade inválido (deve estar entre 0 e 100 mS/cm)');
}

if ($temperatura < -40 || $temperatura > 125) {
    enviar_resposta(400, 'erro', 'Valor de temperatura inválido (deve estar entre -40 e 125°C)');
}

try {
    // Busca o dispositivo pelo código de verificação
    $sql_dispositivo = "SELECT id, usuario_id FROM dispositivos WHERE codigo_verificacao = ?";
    $stmt_dispositivo = $conexao->prepare($sql_dispositivo);
    
    if (!$stmt_dispositivo) {
        throw new Exception('Erro ao preparar consulta de dispositivo: ' . $conexao->error);
    }
    
    $stmt_dispositivo->bind_param("s", $codigo_dispositivo);
    $stmt_dispositivo->execute();
    $resultado_dispositivo = $stmt_dispositivo->get_result();
    
    if ($resultado_dispositivo->num_rows === 0) {
        log_error('Tentativa de envio de dados com código inválido', [
            'codigo_dispositivo' => $codigo_dispositivo,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'desconhecido'
        ]);
        
        enviar_resposta(404, 'erro', 'Dispositivo não encontrado ou código de verificação inválido');
    }
    
    $dispositivo = $resultado_dispositivo->fetch_assoc();
    $dispositivo_id = $dispositivo['id'];
    
    // Inicia transação para garantir consistência
    $conexao->begin_transaction();
    
    // Insere a nova leitura na tabela 'leitura'
    $sql_leitura = "INSERT INTO leitura (dispositivo_id, data_hora, temperatura, ph, turbidez, condutividade) VALUES (?, NOW(), ?, ?, ?, ?)";
    $stmt_leitura = $conexao->prepare($sql_leitura);
    
    if (!$stmt_leitura) {
        throw new Exception('Erro ao preparar inserção de leitura: ' . $conexao->error);
    }
    
    $stmt_leitura->bind_param("idddd", $dispositivo_id, $temperatura, $ph, $turbidez, $condutividade);
    
    if (!$stmt_leitura->execute()) {
        throw new Exception('Erro ao inserir leitura: ' . $stmt_leitura->error);
    }
    
    $leitura_id = $conexao->insert_id;
    
    // Commit da transação
    $conexao->commit();
    
    // Processa alertas usando o novo sistema de regras
    require_once __DIR__ . '/processar_alertas.php';
    $resultado_alertas = processarAlertasParaLeitura($conexao, $dispositivo_id, [
        'ph' => $ph,
        'turbidez' => $turbidez,
        'condutividade' => $condutividade,
        'temperatura' => $temperatura
    ]);
    
    $alertas_gerados = $resultado_alertas['status'] === 'sucesso' ? $resultado_alertas['ids_alertas'] : [];
    
    // Log de sucesso
    log_error('Dados do sensor recebidos e processados com sucesso', [
        'leitura_id' => $leitura_id,
        'dispositivo_id' => $dispositivo_id,
        'codigo_dispositivo' => $codigo_dispositivo,
        'valores' => [
            'ph' => $ph,
            'turbidez' => $turbidez,
            'condutividade' => $condutividade,
            'temperatura' => $temperatura
        ],
        'alertas_gerados' => count($alertas_gerados)
    ]);
    
    $resposta_dados = [
        'leitura_id' => $leitura_id,
        'dispositivo_id' => $dispositivo_id,
        'timestamp' => date('Y-m-d H:i:s'),
        'alertas_gerados' => $alertas_gerados
    ];
    
    enviar_resposta(201, 'sucesso', 'Dados recebidos e armazenados com sucesso', $resposta_dados);
    
} catch (Exception $e) {
    // Rollback em caso de erro
    $conexao->rollback();
    
    log_error('Erro ao processar dados do sensor', [
        'erro' => $e->getMessage(),
        'codigo_dispositivo' => $codigo_dispositivo,
        'dados' => $dados
    ]);
    
    enviar_resposta(500, 'erro', 'Erro interno do servidor ao processar dados');
    
} finally {
    // Fecha statements e conexão
    if (isset($stmt_dispositivo)) {
        $stmt_dispositivo->close();
    }
    if (isset($stmt_leitura)) {
        $stmt_leitura->close();
    }
    $conexao->close();
}

/**
 * Função para verificar limites e gerar alertas se necessário
 * Retorna array com alertas gerados
 */
function verificar_e_gerar_alertas($conexao, $dispositivo_id, $ph, $turbidez, $condutividade, $temperatura) {
    $alertas_gerados = [];
    
    // Definir limites padrão para qualidade da água
    $limites = [
        'ph' => ['min' => 6.5, 'max' => 8.5, 'critico_min' => 6.0, 'critico_max' => 9.0],
        'turbidez' => ['min' => 0, 'max' => 5, 'critico_min' => 0, 'critico_max' => 10],
        'condutividade' => ['min' => 0, 'max' => 2.0, 'critico_min' => 0, 'critico_max' => 2.5],
        'temperatura' => ['min' => 15, 'max' => 25, 'critico_min' => 10, 'critico_max' => 30]
    ];
    
    $valores = [
        'ph' => $ph,
        'turbidez' => $turbidez,
        'condutividade' => $condutividade,
        'temperatura' => $temperatura
    ];
    
    foreach ($valores as $parametro => $valor) {
        $limite = $limites[$parametro];
        $alerta = null;
        
        // Verifica limites críticos
        if ($valor < $limite['critico_min'] || $valor > $limite['critico_max']) {
            $alerta = [
                'tipo' => 'critico',
                'parametro' => $parametro,
                'valor' => $valor,
                'mensagem' => "Valor crítico de $parametro: $valor"
            ];
        }
        // Verifica limites de aviso
        elseif ($valor < $limite['min'] || $valor > $limite['max']) {
            $alerta = [
                'tipo' => 'aviso',
                'parametro' => $parametro,
                'valor' => $valor,
                'mensagem' => "Valor de $parametro fora do ideal: $valor"
            ];
        }
        
        if ($alerta) {
            $alertas_gerados[] = $alerta;
            
            // Log do alerta
            log_error('Alerta gerado para parâmetro fora dos limites', [
                'dispositivo_id' => $dispositivo_id,
                'alerta' => $alerta
            ]);
        }
    }
    
    return $alertas_gerados;
}
?>