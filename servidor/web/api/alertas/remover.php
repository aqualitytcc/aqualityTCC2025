<?php
// Ficheiro: web/api/alertas/remover.php
require_once __DIR__ . '/../../../config.php';
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

function enviar_resposta($codigo, $status, $mensagem) {
    http_response_code($codigo);
    echo json_encode(['status' => $status, 'mensagem' => $mensagem]);
    exit;
}

if (!isset($_SESSION['usuario_id'])) {
    enviar_resposta(403, 'erro', 'Acesso negado.');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$usuario_id = $_SESSION['usuario_id'];
$dados = json_decode(file_get_contents("php://input"));
$regra_id = $dados->regra_id ?? null;

if (empty($regra_id) || !is_numeric($regra_id)) {
    enviar_resposta(400, 'erro', 'O ID da regra é inválido.');
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// A query garante que o utilizador só pode apagar regras que lhe pertencem
$sql = "DELETE FROM regras_alerta WHERE id = ? AND usuario_id = ?";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("ii", $regra_id, $usuario_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        enviar_resposta(200, 'sucesso', 'Regra de alerta removida com sucesso!');
    } else {
        enviar_resposta(404, 'erro', 'Regra não encontrada ou não pertence à sua conta.');
    }
} else {
    enviar_resposta(500, 'erro', 'Ocorreu um erro ao remover a regra.');
}

$stmt->close();
$conexao->close();
?>