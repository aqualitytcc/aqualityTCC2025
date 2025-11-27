<?php
/**
 * Endpoint simples para criar alertas de exemplo
 * Usado pelo botão de teste no aplicativo
 */

require_once __DIR__ . '/config.php';

// Configura CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'erro', 'mensagem' => 'Método não permitido']);
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $usuario_id = $input['usuario_id'] ?? null;
    $acao = $input['acao'] ?? null;
    
    if (!$usuario_id) {
        throw new Exception('ID do usuário é obrigatório');
    }
    
    $conexao = conectar_banco();
    if (!$conexao) {
        throw new Exception('Falha na conexão com o banco de dados');
    }
    
    if ($acao === 'criar_alerta_exemplo') {
        // Criar alerta de exemplo
        $sql = "INSERT INTO alertas (
            usuario_id, 
            dispositivo_id, 
            regra_id, 
            tipo, 
            nivel, 
            titulo, 
            mensagem, 
            valor_atual, 
            valor_limite, 
            lido, 
            resolvido, 
            data_criacao
        ) VALUES (?, 1, NULL, 'qualidade_agua', 'warning', ?, ?, ?, ?, 0, 0, NOW())";
        
        $titulo = 'Alerta de Teste';
        $mensagem = 'Este é um alerta de teste criado pelo aplicativo mobile.';
        $valor_atual = 25.5;
        $valor_limite = 20.0;
        
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("issdd", $usuario_id, $titulo, $mensagem, $valor_atual, $valor_limite);
        
        if ($stmt->execute()) {
            $alerta_id = $conexao->insert_id;
            
            echo json_encode([
                'status' => 'sucesso',
                'mensagem' => 'Alerta de teste criado com sucesso',
                'dados' => [
                    'alerta_id' => $alerta_id,
                    'titulo' => $titulo,
                    'mensagem' => $mensagem
                ]
            ]);
        } else {
            throw new Exception('Erro ao criar alerta de teste');
        }
    } else {
        throw new Exception('Ação não reconhecida');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'erro',
        'mensagem' => $e->getMessage()
    ]);
}
?>

