<?php
// Ficheiro: servidor/web/api/leituras/exportar_csv.php (VERSÃO CORRIGIDA PARA EXCEL)

require_once __DIR__ . '/../../../config.php';
session_start();

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(403);
    die('Acesso negado. Por favor, faça login primeiro.');
}

$usuario_id = $_SESSION['usuario_id'];
$dispositivo_id = filter_input(INPUT_GET, 'dispositivo_id', FILTER_VALIDATE_INT);

if (!$dispositivo_id) {
    http_response_code(400);
    die('O ID do dispositivo é obrigatório.');
}

$data_inicio = $_GET['data_inicio'] ?? null;
$data_fim = $_GET['data_fim'] ?? null;

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    http_response_code(500);
    die('Falha na conexão com o servidor.');
}

$sql = "SELECT l.data_hora, l.temperatura, l.ph, l.turbidez, l.condutividade 
        FROM leitura l
        JOIN dispositivos d ON l.dispositivo_id = d.id
        WHERE d.id = ? AND d.usuario_id = ?";

$params = [$dispositivo_id, $usuario_id];
$types = "ii";

if ($data_inicio) {
    $sql .= " AND l.data_hora >= ?";
    $params[] = $data_inicio . " 00:00:00";
    $types .= "s";
}

if ($data_fim) {
    $sql .= " AND l.data_hora <= ?";
    $params[] = $data_fim . " 23:59:59";
    $types .= "s";
}

$sql .= " ORDER BY l.data_hora ASC";

$stmt = $conexao->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$resultado = $stmt->get_result();

$nome_ficheiro = "aquality_leituras_" . date('Y-m-d') . ".csv";

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $nome_ficheiro . '"');

$output = fopen('php://output', 'w');

// Define o cabeçalho do CSV
$cabecalho = ['Data e Hora', 'Temperatura (C)', 'pH', 'Turbidez (%)', 'Condutividade (ppm)'];

// A MUDANÇA ESTÁ AQUI: Adicionamos o ';' para definir o separador
fputcsv($output, $cabecalho, ';');

// Percorre os resultados do banco de dados e escreve cada linha no CSV
while ($linha = $resultado->fetch_assoc()) {
    // A MUDANÇA ESTÁ AQUI: Adicionamos o ';' para definir o separador
    fputcsv($output, $linha, ';');
}

fclose($output);
$stmt->close();
$conexao->close();
exit;

?>