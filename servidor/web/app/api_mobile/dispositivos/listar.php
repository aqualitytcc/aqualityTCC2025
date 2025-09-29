<?php
/**
 * API para Listar Dispositivos do Usuário - Water Sense Mobile
 * Retorna todos os dispositivos conectados à conta do usuário
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
$usuario_id = $_GET['usuario_id'] ?? null;

if (!$usuario_id) {
    enviar_resposta(400, 'erro', 'ID do usuário é obrigatório.');
}

try {
    // Busca dispositivos do usuário
    $sql_dispositivos = "SELECT id, nome_dispositivo, codigo_verificacao, localizacao, data_criacao 
                         FROM dispositivos 
                         WHERE usuario_id = ? 
                         ORDER BY data_criacao DESC";
    
    $stmt_dispositivos = $conexao->prepare($sql_dispositivos);
    if (!$stmt_dispositivos) {
        throw new Exception('Erro ao preparar consulta de dispositivos: ' . $conexao->error);
    }
    
    $stmt_dispositivos->bind_param("i", $usuario_id);
    $stmt_dispositivos->execute();
    $resultado_dispositivos = $stmt_dispositivos->get_result();
    
    $dispositivos = [];
    
    while ($dispositivo = $resultado_dispositivos->fetch_assoc()) {
        // Para cada dispositivo, conta as leituras
        $total_leituras = 0;
        $ultima_leitura = null;
        
        // Verifica se a tabela leitura existe
        $sql_check_leituras = "SHOW TABLES LIKE 'leitura'";
        $resultado_check = $conexao->query($sql_check_leituras);
        
        if ($resultado_check && $resultado_check->num_rows > 0) {
            // Conta total de leituras - FILTRO: apenas dados completos (sem NULL)
            $sql_leituras = "SELECT COUNT(*) as total FROM leitura 
                             WHERE dispositivo_id = ? 
                             AND ph IS NOT NULL 
                             AND turbidez IS NOT NULL 
                             AND condutividade IS NOT NULL 
                             AND temperatura IS NOT NULL";
            $stmt_leituras = $conexao->prepare($sql_leituras);
            $stmt_leituras->bind_param("i", $dispositivo['id']);
            $stmt_leituras->execute();
            $total_leituras = $stmt_leituras->get_result()->fetch_assoc()['total'];
            
            // Busca última leitura - FILTRO: apenas dados completos (sem NULL)
            $sql_ultima = "SELECT data_hora, temperatura, ph, turbidez, condutividade 
                           FROM leitura 
                           WHERE dispositivo_id = ? 
                           AND ph IS NOT NULL 
                           AND turbidez IS NOT NULL 
                           AND condutividade IS NOT NULL 
                           AND temperatura IS NOT NULL
                           ORDER BY data_hora DESC 
                           LIMIT 1";
            $stmt_ultima = $conexao->prepare($sql_ultima);
            $stmt_ultima->bind_param("i", $dispositivo['id']);
            $stmt_ultima->execute();
            $resultado_ultima = $stmt_ultima->get_result();
            
            if ($resultado_ultima->num_rows > 0) {
                $ultima_leitura = $resultado_ultima->fetch_assoc();
            }
        }
        
        $dispositivos[] = [
            'id' => intval($dispositivo['id']),
            'nome' => $dispositivo['nome_dispositivo'],
            'codigo_verificacao' => $dispositivo['codigo_verificacao'],
            'localizacao' => $dispositivo['localizacao'],
            'data_criacao' => $dispositivo['data_criacao'],
            'total_leituras' => intval($total_leituras),
            'ultima_leitura' => $ultima_leitura
        ];
    }
    
    $dados_resposta = [
        'dispositivos' => $dispositivos,
        'total_dispositivos' => count($dispositivos),
        'resumo' => [
            'total_dispositivos' => count($dispositivos),
            'total_leituras' => array_sum(array_column($dispositivos, 'total_leituras'))
        ]
    ];
    
    log_error('Dispositivos do usuário listados com sucesso', [
        'usuario_id' => $usuario_id,
        'total_dispositivos' => count($dispositivos)
    ]);
    
    enviar_resposta(200, 'sucesso', 'Dispositivos obtidos com sucesso', $dados_resposta);
    
} catch (Exception $e) {
    log_error('Erro ao listar dispositivos do usuário', [
        'erro' => $e->getMessage(),
        'usuario_id' => $usuario_id
    ]);
    
    enviar_resposta(500, 'erro', 'Erro interno do servidor: ' . $e->getMessage());
}

$conexao->close();
?>