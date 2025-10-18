<?php
// Ficheiro: servidor/web/api/usuarios/executar_redefinicao.php

require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../api_handler.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$dados = json_decode(file_get_contents("php://input"));
$token = $dados->token ?? '';
$nova_senha = $dados->nova_senha ?? '';

if (empty($token) || empty($nova_senha)) {
    enviar_resposta(400, 'erro', 'Token e nova senha são obrigatórios.');
}

if (strlen($nova_senha) < 6) { // A mesma regra do registro
    enviar_resposta(400, 'erro', 'A nova senha deve ter pelo menos 6 caracteres.');
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// Procura um utilizador com um token válido e que não tenha expirado
$stmt = $conexao->prepare("SELECT id FROM usuario WHERE token_redefinicao = ? AND token_redefinicao_expira_em > NOW() LIMIT 1");
$stmt->bind_param("s", $token);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 1) {
    $utilizador = $resultado->fetch_assoc();
    $utilizador_id = $utilizador['id'];

    // Cria o hash da nova senha
    $senha_hash = password_hash($nova_senha, PASSWORD_DEFAULT);

    // Atualiza a senha e limpa os campos do token para que não possa ser reutilizado
    $stmt_update = $conexao->prepare("UPDATE usuario SET senha = ?, token_redefinicao = NULL, token_redefinicao_expira_em = NULL WHERE id = ?");
    $stmt_update->bind_param("si", $senha_hash, $utilizador_id);

    if ($stmt_update->execute()) {
        enviar_resposta(200, 'sucesso', 'Senha redefinida com sucesso! Já pode fazer login com a nova senha.');
    } else {
        enviar_resposta(500, 'erro', 'Ocorreu um erro ao redefinir a sua senha. Tente novamente.');
    }
    $stmt_update->close();
} else {
    enviar_resposta(404, 'erro', 'Token de redefinição inválido ou expirado. Por favor, solicite um novo.');
}

$stmt->close();
$conexao->close();

?>