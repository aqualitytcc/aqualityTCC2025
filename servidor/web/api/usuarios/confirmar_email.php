<?php
// Ficheiro: servidor/web/api/usuarios/confirmar_email.php

require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../api_handler.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$dados = json_decode(file_get_contents("php://input"));
$token = $dados->token ?? '';

if (empty($token)) {
    enviar_resposta(400, 'erro', 'Token de verificação inválido ou ausente.');
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// Procura um utilizador com o token de verificação fornecido que ainda não tenha sido verificado
$stmt = $conexao->prepare("SELECT id FROM usuario WHERE token_verificacao = ? AND email_verificado_em IS NULL LIMIT 1");
$stmt->bind_param("s", $token);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 1) {
    $utilizador = $resultado->fetch_assoc();
    $utilizador_id = $utilizador['id'];

    // Atualiza a conta do utilizador: define a data de verificação e remove o token
    $stmt_update = $conexao->prepare("UPDATE usuario SET email_verificado_em = NOW(), token_verificacao = NULL WHERE id = ?");
    $stmt_update->bind_param("i", $utilizador_id);

    if ($stmt_update->execute()) {
        enviar_resposta(200, 'sucesso', 'Email verificado com sucesso! Já pode fazer login.');
    } else {
        enviar_resposta(500, 'erro', 'Ocorreu um erro ao verificar o seu email. Tente novamente.');
    }
    $stmt_update->close();
} else {
    enviar_resposta(404, 'erro', 'Token inválido, expirado ou o email já foi verificado.');
}

$stmt->close();
$conexao->close();

?>