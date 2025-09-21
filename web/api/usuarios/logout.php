<?php
// Ficheiro: web/api/usuarios/logout.php

// Inicia a sessão para poder aceder a ela.
session_start();

// Apaga todas as variáveis da sessão.
$_SESSION = array();

// Destrói a sessão.
session_destroy();

// Define o cabeçalho da resposta como JSON.
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

// Envia uma resposta de sucesso.
http_response_code(200);
echo json_encode(['status' => 'sucesso', 'mensagem' => 'Logout realizado com sucesso.']);
?>