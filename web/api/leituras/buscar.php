<?php
// Ficheiro: web/api/leituras/buscar.php
require_once __DIR__ . '/../../../config.php';
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(403);
    echo json_encode(['status' => 'erro', 'mensagem' => 'Acesso negado.']);
    exit;
}

$dispositivo_id = filter_input(INPUT_GET, 'dispositivo_id', FILTER_VALIDATE_INT);

if (!$dispositivo_id) {
    http_response_code(400);
    echo json_encode(['status' => 'erro', 'mensagem' => 'ID do dispositivo é obrigatório.']);
    exit;
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'erro', 'mensagem' => 'Falha na conexão com o servidor.']);
    exit;
}

// Busca as últimas 100 leituras para um dispositivo, ordenadas da mais antiga para a mais recente
$sql = "SELECT * FROM (
            SELECT data_hora, temperatura, ph, turbidez, condutividade 
            FROM leitura 
            WHERE dispositivo_id = ? 
            ORDER BY data_hora DESC 
            LIMIT 100
        ) AS sub ORDER BY data_hora ASC";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $dispositivo_id);
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