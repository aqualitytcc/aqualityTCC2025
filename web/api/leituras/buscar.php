<?php
// Ficheiro: web/api/leituras/buscar.php (VERSÃO ATUALIZADA COM FILTRO DE DATA)
require_once __DIR__ . '/../../../config.php';
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(403);
    echo json_encode(['status' => 'erro', 'mensagem' => 'Acesso negado.']);
    exit;
}

// 1. Validar o ID do dispositivo
$dispositivo_id = filter_input(INPUT_GET, 'dispositivo_id', FILTER_VALIDATE_INT);
if (!$dispositivo_id) {
    http_response_code(400);
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID do dispositivo é obrigatório.']);
    exit;
}

// 2. Obter as datas (opcionais) do pedido GET
$data_inicio = $_GET['data_inicio'] ?? null;
$data_fim = $_GET['data_fim'] ?? null;

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'erro', 'mensagem' => 'Falha na conexão com o servidor.']);
    exit;
}

// 3. Montar a query SQL dinamicamente
$sql = "SELECT data_hora, temperatura, ph, turbidez, condutividade 
        FROM leitura 
        WHERE dispositivo_id = ?";
$params = [$dispositivo_id];
$types = "i";

// Adiciona o filtro de data de início, se fornecido
if ($data_inicio) {
    $sql .= " AND data_hora >= ?";
    $params[] = $data_inicio . " 00:00:00"; // Adiciona o início do dia
    $types .= "s";
}

// Adiciona o filtro de data de fim, se fornecido
if ($data_fim) {
    $sql .= " AND data_hora <= ?";
    $params[] = $data_fim . " 23:59:59"; // Adiciona o fim do dia
    $types .= "s";
}

$sql .= " ORDER BY data_hora ASC"; // Ordena da mais antiga para a mais recente

$stmt = $conexao->prepare($sql);
// Usa o operador 'splat' (...) para passar os parâmetros dinamicamente
$stmt->bind_param($types, ...$params);
$stmt->execute();
$resultado = $stmt->get_result();

$leituras = [];
while ($linha = $resultado->fetch_assoc()) {
    $leituras[] = $linha;
}

echo json_encode($leituras);

$stmt->close();
$conexao->close();
?>