<?php
// Ficheiro: servidor/web/api/usuarios/login.php (VERSÃO FINAL COM VERIFICAÇÃO)

require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../api_handler.php';
session_start();

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

// ATUALIZAÇÃO: Busca também o campo 'email_verificado_em'
$sql = "SELECT id, nome, sobrenome, senha, email_verificado_em FROM usuario WHERE email = ? LIMIT 1";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 1) {
    $usuario = $resultado->fetch_assoc();
    
    if (password_verify($senha, $usuario['senha'])) {
        // NOVA VERIFICAÇÃO: Verifica se o email foi confirmado
        if ($usuario['email_verificado_em'] === null) {
            enviar_resposta(403, 'erro', 'A sua conta ainda não foi ativada. Por favor, verifique o email de confirmação que lhe enviámos.');
        }
        
        // Se a senha estiver correta E o email verificado, inicia a sessão
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];
        
        unset($usuario['senha']);
        unset($usuario['email_verificado_em']);

        enviar_resposta(200, 'sucesso', 'Login realizado com sucesso!', $usuario);
    } else {
        enviar_resposta(401, 'erro', 'Credenciais inválidas.');
    }
} else {
    enviar_resposta(401, 'erro', 'Credenciais inválidas.');
}

$stmt->close();
$conexao->close();
?>