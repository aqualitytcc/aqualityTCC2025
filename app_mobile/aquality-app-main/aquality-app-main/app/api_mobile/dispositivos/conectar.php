<?php
/**
 * API para Conectar Dispositivo - Water Sense Mobile
 * Permite ao usuário conectar um dispositivo à sua conta usando código de verificação
 */

require_once __DIR__ . '/../config.php';

// Configura CORS e headers
configurar_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido. Use POST.');
}

// Conecta ao banco de dados
$conexao = conectar_banco();
if (!$conexao) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.');
}

// Lê os dados JSON do corpo da requisição
$input = json_decode(file_get_contents('php://input'), true);

$usuario_id = $input['usuario_id'] ?? null;
$codigo_verificacao = $input['codigo_verificacao'] ?? null;

// Validação básica
if (!$usuario_id || !$codigo_verificacao) {
    enviar_resposta(400, 'erro', 'ID do usuário e código de verificação são obrigatórios.');
}

try {
    // Verifica se o código de verificação existe e não está associado a nenhum usuário
    $sql_verificar = "SELECT id, nome_dispositivo, localizacao, usuario_id 
                      FROM dispositivos 
                      WHERE codigo_verificacao = ?";
    
    $stmt_verificar = $conexao->prepare($sql_verificar);
    if (!$stmt_verificar) {
        throw new Exception('Erro ao preparar consulta de verificação: ' . $conexao->error);
    }
    
    $stmt_verificar->bind_param("s", $codigo_verificacao);
    $stmt_verificar->execute();
    $resultado_verificar = $stmt_verificar->get_result();
    
    if ($resultado_verificar->num_rows === 0) {
        enviar_resposta(404, 'erro', 'Código de verificação não encontrado.');
    }
    
    $dispositivo = $resultado_verificar->fetch_assoc();
    
    // Verifica se o dispositivo já está associado a um usuário
    if ($dispositivo['usuario_id'] !== null) {
        enviar_resposta(409, 'erro', 'Este dispositivo já está conectado a uma conta.');
    }
    
    // Conecta o dispositivo ao usuário
    $sql_conectar = "UPDATE dispositivos SET usuario_id = ? WHERE codigo_verificacao = ?";
    
    $stmt_conectar = $conexao->prepare($sql_conectar);
    if (!$stmt_conectar) {
        throw new Exception('Erro ao preparar consulta de conexão: ' . $conexao->error);
    }
    
    $stmt_conectar->bind_param("is", $usuario_id, $codigo_verificacao);
    
    if (!$stmt_conectar->execute()) {
        throw new Exception('Erro ao conectar dispositivo: ' . $stmt_conectar->error);
    }
    
    // Busca informações atualizadas do dispositivo
    $sql_dispositivo = "SELECT id, nome_dispositivo, codigo_verificacao, localizacao, usuario_id 
                        FROM dispositivos 
                        WHERE codigo_verificacao = ?";
    
    $stmt_dispositivo = $conexao->prepare($sql_dispositivo);
    $stmt_dispositivo->bind_param("s", $codigo_verificacao);
    $stmt_dispositivo->execute();
    $dispositivo_atualizado = $stmt_dispositivo->get_result()->fetch_assoc();
    
    // Conta total de leituras do dispositivo (se a tabela existir)
    $total_leituras = 0;
    $sql_check_leituras = "SHOW TABLES LIKE 'leitura'";
    $resultado_check = $conexao->query($sql_check_leituras);
    
    if ($resultado_check && $resultado_check->num_rows > 0) {
        $sql_leituras = "SELECT COUNT(*) as total FROM leitura WHERE dispositivo_id = ?";
        $stmt_leituras = $conexao->prepare($sql_leituras);
        $stmt_leituras->bind_param("i", $dispositivo_atualizado['id']);
        $stmt_leituras->execute();
        $total_leituras = $stmt_leituras->get_result()->fetch_assoc()['total'];
    }
    
    $dados_resposta = [
        'dispositivo' => [
            'id' => intval($dispositivo_atualizado['id']),
            'nome' => $dispositivo_atualizado['nome_dispositivo'],
            'codigo_verificacao' => $dispositivo_atualizado['codigo_verificacao'],
            'localizacao' => $dispositivo_atualizado['localizacao'],
            'usuario_id' => intval($dispositivo_atualizado['usuario_id']),
            'total_leituras' => intval($total_leituras)
        ],
        'mensagem_sucesso' => "Dispositivo '{$dispositivo_atualizado['nome_dispositivo']}' conectado com sucesso!"
    ];
    
    log_error('Dispositivo conectado com sucesso', [
        'usuario_id' => $usuario_id,
        'dispositivo_id' => $dispositivo_atualizado['id'],
        'codigo_verificacao' => $codigo_verificacao
    ]);
    
    enviar_resposta(200, 'sucesso', 'Dispositivo conectado com sucesso!', $dados_resposta);
    
} catch (Exception $e) {
    log_error('Erro ao conectar dispositivo', [
        'erro' => $e->getMessage(),
        'usuario_id' => $usuario_id,
        'codigo_verificacao' => $codigo_verificacao
    ]);
    
    enviar_resposta(500, 'erro', 'Erro interno do servidor: ' . $e->getMessage());
}

$conexao->close();
?>