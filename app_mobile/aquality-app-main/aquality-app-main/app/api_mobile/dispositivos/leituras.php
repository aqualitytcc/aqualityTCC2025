<?php
/**
 * API para Buscar Leituras de um Dispositivo - Water Sense Mobile
 * Retorna as últimas leituras de um dispositivo específico
 */

require_once __DIR__ . '/../config.php';

// Configura CORS e headers
configurar_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    enviar_resposta(405, 'erro', 'Método não permitido. Use GET.');
}

// Conecta ao banco de dados
$conexao = conectar_banco();
if (!$conexao) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.');
}

// Parâmetros da URL
$dispositivo_id = $_GET['dispositivo_id'] ?? null;
$limite = $_GET['limite'] ?? 10;

if (!$dispositivo_id) {
    enviar_resposta(400, 'erro', 'ID do dispositivo é obrigatório.');
}

try {
    // Verifica se o dispositivo existe
    $sql_check = "SELECT id, nome_dispositivo, localizacao, usuario_id FROM dispositivos WHERE id = ?";
    $stmt_check = $conexao->prepare($sql_check);
    $stmt_check->bind_param("i", $dispositivo_id);
    $stmt_check->execute();
    $resultado_check = $stmt_check->get_result();
    
    if ($resultado_check->num_rows === 0) {
        enviar_resposta(404, 'erro', 'Dispositivo não encontrado.');
    }
    
    $dispositivo = $resultado_check->fetch_assoc();
    
    // Verifica se a tabela leitura existe
    $sql_check_leituras = "SHOW TABLES LIKE 'leitura'";
    $resultado_check_table = $conexao->query($sql_check_leituras);
    
    if (!$resultado_check_table || $resultado_check_table->num_rows === 0) {
        // Se não existe tabela, retorna dispositivo sem leituras
        $dados_resposta = [
            'dispositivo' => [
                'id' => intval($dispositivo['id']),
                'nome' => $dispositivo['nome_dispositivo'],
                'localizacao' => $dispositivo['localizacao'],
                'usuario_id' => intval($dispositivo['usuario_id'])
            ],
            'leituras' => [],
            'total_leituras' => 0,
            'estatisticas' => [
                'temperatura_media' => 0,
                'ph_medio' => 0,
                'turbidez_media' => 0,
                'condutividade_media' => 0,
                'ultima_leitura' => null
            ]
        ];
        
        enviar_resposta(200, 'sucesso', 'Dispositivo encontrado (sem leituras)', $dados_resposta);
    }
    
    // Busca as leituras mais recentes
    $sql_leituras = "SELECT 
                        data_hora,
                        temperatura,
                        ph,
                        turbidez,
                        condutividade
                     FROM leitura 
                     WHERE dispositivo_id = ? 
                     ORDER BY data_hora DESC 
                     LIMIT ?";
    
    $stmt_leituras = $conexao->prepare($sql_leituras);
    $stmt_leituras->bind_param("ii", $dispositivo_id, $limite);
    $stmt_leituras->execute();
    $resultado_leituras = $stmt_leituras->get_result();
    
    $leituras = [];
    while ($leitura = $resultado_leituras->fetch_assoc()) {
        $leituras[] = [
            'data_hora' => $leitura['data_hora'],
            'temperatura' => floatval($leitura['temperatura']),
            'ph' => floatval($leitura['ph']),
            'turbidez' => floatval($leitura['turbidez']),
            'condutividade' => floatval($leitura['condutividade'])
        ];
    }
    
    // Calcula estatísticas se há leituras
    $estatisticas = [
        'temperatura_media' => 0,
        'ph_medio' => 0,
        'turbidez_media' => 0,
        'condutividade_media' => 0,
        'ultima_leitura' => null
    ];
    
    if (count($leituras) > 0) {
        $temperatura_total = array_sum(array_column($leituras, 'temperatura'));
        $ph_total = array_sum(array_column($leituras, 'ph'));
        $turbidez_total = array_sum(array_column($leituras, 'turbidez'));
        $condutividade_total = array_sum(array_column($leituras, 'condutividade'));
        
        $count = count($leituras);
        
        $estatisticas = [
            'temperatura_media' => round($temperatura_total / $count, 2),
            'ph_medio' => round($ph_total / $count, 2),
            'turbidez_media' => round($turbidez_total / $count, 2),
            'condutividade_media' => round($condutividade_total / $count, 2),
            'ultima_leitura' => $leituras[0]['data_hora']
        ];
    }
    
    // Conta total de leituras
    $sql_count = "SELECT COUNT(*) as total FROM leitura 
                  WHERE dispositivo_id = ?";
    $stmt_count = $conexao->prepare($sql_count);
    $stmt_count->bind_param("i", $dispositivo_id);
    $stmt_count->execute();
    $total_leituras = $stmt_count->get_result()->fetch_assoc()['total'];
    
    $dados_resposta = [
        'dispositivo' => [
            'id' => intval($dispositivo['id']),
            'nome' => $dispositivo['nome_dispositivo'],
            'localizacao' => $dispositivo['localizacao'],
            'usuario_id' => intval($dispositivo['usuario_id'])
        ],
        'leituras' => $leituras,
        'total_leituras' => intval($total_leituras),
        'estatisticas' => $estatisticas,
        'limite_aplicado' => intval($limite)
    ];
    
    log_error('Leituras do dispositivo obtidas com sucesso', [
        'dispositivo_id' => $dispositivo_id,
        'total_leituras' => $total_leituras,
        'limite' => $limite
    ]);
    
    enviar_resposta(200, 'sucesso', 'Leituras obtidas com sucesso', $dados_resposta);
    
} catch (Exception $e) {
    log_error('Erro ao buscar leituras do dispositivo', [
        'erro' => $e->getMessage(),
        'dispositivo_id' => $dispositivo_id
    ]);
    
    enviar_resposta(500, 'erro', 'Erro interno do servidor: ' . $e->getMessage());
}

$conexao->close();
?>