<?php
// Ficheiro: web/api/dispositivos/remover.php
// LÓGICA ATUALIZADA: Desassocia o dispositivo do utilizador (não apaga)
require_once __DIR__ . '/../../../config.php';
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

function enviar_resposta($codigo, $status, $mensagem) {
    http_response_code($codigo);
    echo json_encode(['status' => $status, 'mensagem' => $mensagem]);
    exit;
}

// 1. Verificar se o utilizador está logado
if (!isset($_SESSION['usuario_id'])) {
    enviar_resposta(403, 'erro', 'Acesso negado. Por favor, faça login primeiro.');
}

// 2. Verificar se o método da requisição é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$usuario_id = $_SESSION['usuario_id'];
$dados = json_decode(file_get_contents("php://input"));

// 3. Validar os dados recebidos
$dispositivo_id = $dados->dispositivo_id ?? null;
if (empty($dispositivo_id) || !is_numeric($dispositivo_id)) {
    enviar_resposta(400, 'erro', 'O ID do dispositivo é inválido.');
}

// 4. Conectar à base de dados
$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// 5. LÓGICA DE DESASSOCIAÇÃO:
// Define usuario_id, nome_dispositivo e localizacao como NULL
// onde o ID do dispositivo e o ID do utilizador correspondem.
$sql = "UPDATE dispositivos SET usuario_id = NULL, nome_dispositivo = NULL, localizacao = NULL WHERE id = ? AND usuario_id = ?";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("ii", $dispositivo_id, $usuario_id);

if ($stmt->execute()) {
    // Verifica se alguma linha foi realmente atualizada
    if ($stmt->affected_rows > 0) {
        enviar_resposta(200, 'sucesso', 'Dispositivo desassociado com sucesso!');
    } else {
        enviar_resposta(404, 'erro', 'Dispositivo não encontrado ou não pertence a este utilizador.');
    }
} else {
    enviar_resposta(500, 'erro', 'Ocorreu um erro ao desassociar o dispositivo.');
}

$stmt->close();
$conexao->close();
?>