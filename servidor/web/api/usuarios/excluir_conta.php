<?php
// Ficheiro: web/api/usuarios/excluir_conta.php (VERSÃO CORRIGIDA)
require_once __DIR__ . '/../../../config.php';
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

function enviar_resposta($codigo, $status, $mensagem) {
    http_response_code($codigo);
    echo json_encode(['status' => $status, 'mensagem' => $mensagem]);
    exit;
}

// 1. Verificar se o utilizador está logado e se o método é POST
if (!isset($_SESSION['usuario_id'])) {
    enviar_resposta(403, 'erro', 'Acesso negado. Por favor, faça login primeiro.');
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$usuario_id = $_SESSION['usuario_id'];
$dados = json_decode(file_get_contents("php://input"));
$senha_confirmacao = $dados->senha ?? '';

if (empty($senha_confirmacao)) {
    enviar_resposta(400, 'erro', 'A senha de confirmação é obrigatória.');
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// Inicia uma transação para garantir a integridade dos dados
$conexao->begin_transaction();

try {
    // 2. Buscar a senha atual para verificação
    $sql_fetch = "SELECT senha FROM usuario WHERE id = ? LIMIT 1";
    $stmt_fetch = $conexao->prepare($sql_fetch);
    $stmt_fetch->bind_param("i", $usuario_id);
    $stmt_fetch->execute();
    $resultado = $stmt_fetch->get_result();

    if ($resultado->num_rows !== 1) {
        throw new Exception('Utilizador não encontrado.', 404);
    }
    $usuario = $resultado->fetch_assoc();
    $stmt_fetch->close();

    // 3. Verificar se a senha de confirmação está correta
    if (!password_verify($senha_confirmacao, $usuario['senha'])) {
        enviar_resposta(401, 'erro', 'Senha de confirmação incorreta.');
    }

    // 4. MUDANÇA PRINCIPAL: Desassociar os dispositivos em vez de apagar
    // Limpa os dados do utilizador dos dispositivos, tornando-os disponíveis novamente.
    $sql_update_devices = "UPDATE dispositivos SET usuario_id = NULL, nome_dispositivo = NULL, localizacao = NULL WHERE usuario_id = ?";
    $stmt_update_devices = $conexao->prepare($sql_update_devices);
    $stmt_update_devices->bind_param("i", $usuario_id);
    $stmt_update_devices->execute();
    $stmt_update_devices->close();
    
    // NOTA: As leituras continuarão no banco, associadas ao dispositivo físico, o que é o correto.

    // 5. Agora, apagar o registro do utilizador
    $sql_delete_user = "DELETE FROM usuario WHERE id = ?";
    $stmt_delete_user = $conexao->prepare($sql_delete_user);
    $stmt_delete_user->bind_param("i", $usuario_id);
    $stmt_delete_user->execute();
    
    if ($stmt_delete_user->affected_rows > 0) {
        // Confirma a transação
        $conexao->commit();
        $stmt_delete_user->close();
        
        // 6. Destruir a sessão
        session_destroy();
        enviar_resposta(200, 'sucesso', 'Conta excluída com sucesso. Os seus dispositivos foram desassociados.');
    } else {
        throw new Exception('Não foi possível excluir a conta.', 500);
    }

} catch (Exception $e) {
    // Se algo der errado, desfaz as alterações
    $conexao->rollback();
    enviar_resposta($e->getCode() ?: 500, 'erro', 'Ocorreu um erro: ' . $e->getMessage());
}

$conexao->close();
?>