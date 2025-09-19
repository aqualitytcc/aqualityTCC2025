<?php
// Arquivo: servidor/web/api/usuarios/login.php
// Requisito Funcional: RF002 - O sistema deve permitir o login de usuários autenticados com e-mail e senha.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . '/../../config.php';

// Inicia a sessão PHP. Essencial para manter o usuário logado entre as páginas.
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

function enviar_resposta($codigo_http, $status, $mensagem, $dados = null) {
    http_response_code($codigo_http);
    $resposta = ['status' => $status, 'mensagem' => $mensagem];
    if ($dados) {
        $resposta['dados'] = $dados;
    }
    echo json_encode($resposta);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco.');
}

$dados = json_decode(file_get_contents("php://input"));
$email = $dados->email ?? '';
$senha = $dados->senha ?? '';

if (empty($email) || empty($senha)) {
    enviar_resposta(400, 'erro', 'Email e senha são obrigatórios.');
}

// Busca o usuário pelo e-mail para obter o hash da senha.
$sql = "SELECT id, nome, sobrenome, senha FROM usuario WHERE email = ? LIMIT 1";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 1) {
    $usuario = $resultado->fetch_assoc();
    
    // **SEGURANÇA: Verifica a senha enviada com o hash salvo no banco.**
    if (password_verify($senha, $usuario['senha'])) {
        // Senha correta! Armazena os dados na sessão.
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];
        
        // Remove a senha do array antes de enviar a resposta.
        unset($usuario['senha']);

        enviar_resposta(200, 'sucesso', 'Login realizado com sucesso!', $usuario);
    } else {
        // Senha incorreta.
        enviar_resposta(401, 'erro', 'Credenciais inválidas.');
    }
} else {
    // Usuário não encontrado.
    enviar_resposta(401, 'erro', 'Credenciais inválidas.');
}

$stmt->close();
$conexao->close();
?>