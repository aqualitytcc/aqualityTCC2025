<?php
// Ficheiro: web/api/leituras/buscar.php (VERSÃO CORRIGIDA E MELHORADA)
require_once __DIR__ . '/../../../config.php';
session_start();

header("Content-Type: application/json; charset=UTF-8");

// Reintroduzindo a função padrão para consistência
function enviar_resposta($codigo, $status, $mensagem, $dados = null) {
    http_response_code($codigo);
    $resposta = ['status' => $status, 'mensagem' => $mensagem];
    if (isset($dados)) { // Usar isset para permitir arrays vazios
        $resposta['dados'] = $dados;
    }
    echo json_encode($resposta);
    exit;
}

// Função auxiliar para validar o formato da data
function validar_data($data) {
    $d = DateTime::createFromFormat('Y-m-d', $data);
    return $d && $d->format('Y-m-d') === $data;
}

if (!isset($_SESSION['usuario_id'])) {
    enviar_resposta(403, 'erro', 'Acesso negado. Por favor, faça login primeiro.');
}

$usuario_id = $_SESSION['usuario_id'];

// 1. Validar o ID do dispositivo
$dispositivo_id = filter_input(INPUT_GET, 'dispositivo_id', FILTER_VALIDATE_INT);
if (!$dispositivo_id) {
    enviar_resposta(400, 'erro', 'O ID do dispositivo é obrigatório e deve ser um número.');
}

// 2. Obter e validar as datas (opcionais)
$data_inicio = $_GET['data_inicio'] ?? null;
$data_fim = $_GET['data_fim'] ?? null;

if ($data_inicio && !validar_data($data_inicio)) {
    enviar_resposta(400, 'erro', 'O formato da data de início é inválido. Use AAAA-MM-DD.');
}
if ($data_fim && !validar_data($data_fim)) {
    enviar_resposta(400, 'erro', 'O formato da data de fim é inválido. Use AAAA-MM-DD.');
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// 3. Montar a query SQL com a CORREÇÃO DE SEGURANÇA (JOIN com dispositivos)
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
if (!$stmt) {
    enviar_resposta(500, 'erro', 'Erro ao preparar a consulta SQL.');
}

$stmt->bind_param($types, ...$params);
$stmt->execute();
$resultado = $stmt->get_result();

$leituras = [];
while ($linha = $resultado->fetch_assoc()) {
    $leituras[] = $linha;
}

// Resposta final no formato padronizado
enviar_resposta(200, 'sucesso', 'Leituras obtidas com sucesso.', $leituras);

$stmt->close();
$conexao->close();
?>