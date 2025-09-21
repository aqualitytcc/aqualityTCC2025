<?php
// Ficheiro: web/api/dispositivos/atualizar.php
require_once __DIR__ . '/../../../config.php';
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST"); // Usamos POST para atualizações
header("Access-Control-Allow-Headers: Content-Type");

function enviar_resposta($codigo, $status, $mensagem) {
    http_response_code($codigo);
    echo json_encode(['status' => $status, 'mensagem' => $mensagem]);
    exit;
}

// 1. Verificar login e método
if (!isset($_SESSION['usuario_id'])) {
    enviar_resposta(403, 'erro', 'Acesso negado. Por favor, faça login primeiro.');
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$usuario_id = $_SESSION['usuario_id'];
$dados = json_decode(file_get_contents("php://input"));

// 2. Validar dados recebidos
$dispositivo_id = $dados->dispositivo_id ?? null;
$nome_dispositivo = $dados->nome_dispositivo ?? '';
$localizacao = $dados->localizacao ?? '';

if (empty($dispositivo_id) || empty($nome_dispositivo)) {
    enviar_resposta(400, 'erro', 'O ID e o Nome do Dispositivo são obrigatórios.');
}

// 3. Conectar à base de dados
$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// 4. Atualizar o dispositivo, garantindo que pertence ao utilizador logado
$sql = "UPDATE dispositivos SET nome_dispositivo = ?, localizacao = ? WHERE id = ? AND usuario_id = ?";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("ssii", $nome_dispositivo, $localizacao, $dispositivo_id, $usuario_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        enviar_resposta(200, 'sucesso', 'Dispositivo atualizado com sucesso!');
    } else {
        enviar_resposta(404, 'erro', 'Dispositivo não encontrado ou não pertence a este utilizador.');
    }
} else {
    enviar_resposta(500, 'erro', 'Ocorreu um erro ao atualizar o dispositivo.');
}

$stmt->close();
$conexao->close();
?>