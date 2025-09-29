<?php
// Arquivo: receber_dados.php

require_once __DIR__ . '/../../config.php';

function enviar_resposta($httpCode, $status, $mensagem) {
    header('Content-Type: application/json');
    http_response_code($httpCode);
    echo json_encode(['status' => $status, 'mensagem' => $mensagem]);
    exit;
}

// 1. VERIFICA O MÉTODO
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

// 2. CONECTA AO BANCO
$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco.');
}

// 3. AUTENTICA O DISPOSITIVO
$codigo_verificacao = filter_input(INPUT_POST, 'codigo_verificacao', FILTER_SANITIZE_STRING);
if (empty($codigo_verificacao)) {
    enviar_resposta(400, 'erro', 'codigo_verificacao é obrigatório.');
}

$stmt_auth = $conexao->prepare("SELECT id FROM dispositivos WHERE codigo_verificacao = ?");
$stmt_auth->bind_param("s", $codigo_verificacao);
$stmt_auth->execute();
$resultado_auth = $stmt_auth->get_result();
if ($resultado_auth->num_rows === 0) {
    enviar_resposta(403, 'erro', 'Dispositivo não autorizado.');
}
$dispositivo_id = $resultado_auth->fetch_assoc()['id'];
$stmt_auth->close();

// 4. RECEBE OS DADOS DOS SENSORES
// FILTER_NULL_ON_FAILURE garante que a variável será NULL se o parâmetro não for enviado pelo ESP
$temperatura   = filter_input(INPUT_POST, 'temperatura', FILTER_VALIDATE_FLOAT, FILTER_NULL_ON_FAILURE);
$ph            = filter_input(INPUT_POST, 'ph', FILTER_VALIDATE_FLOAT, FILTER_NULL_ON_FAILURE);
$turbidez      = filter_input(INPUT_POST, 'turbidez', FILTER_VALIDATE_FLOAT, FILTER_NULL_ON_FAILURE);
$condutividade = filter_input(INPUT_POST, 'condutividade', FILTER_VALIDATE_FLOAT, FILTER_NULL_ON_FAILURE);

// 5. INSERE DIRETAMENTE NA TABELA 'leitura'
$sql = "INSERT INTO leitura (dispositivo_id, temperatura, ph, turbidez, condutividade) VALUES (?, ?, ?, ?, ?)";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("iddds", $dispositivo_id, $temperatura, $ph, $turbidez, $condutividade);

if ($stmt->execute()) {
    enviar_resposta(201, 'sucesso', 'Leitura inserida com sucesso.');
} else {
    enviar_resposta(500, 'erro', 'Falha ao inserir leitura.');
}

$stmt->close();
$conexao->close();
?>