<?php
// Ficheiro: web/api/alertas/criar.php
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
    enviar_resposta(403, 'erro', 'Acesso negado. Por favor, faça o login.');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$usuario_id = $_SESSION['usuario_id'];
$dados = json_decode(file_get_contents("php://input"));

$dispositivo_id = $dados->dispositivo_id ?? null;
$parametro = $dados->parametro ?? '';
$condicao = $dados->condicao ?? '';
$valor = $dados->valor ?? null;

if (empty($dispositivo_id) || empty($parametro) || empty($condicao) || !is_numeric($valor)) {
    enviar_resposta(400, 'erro', 'Todos os campos são obrigatórios e o valor deve ser numérico.');
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// Segurança: Verifica se o dispositivo pertence ao utilizador logado
$sql_check = "SELECT id FROM dispositivos WHERE id = ? AND usuario_id = ?";
$stmt_check = $conexao->prepare($sql_check);
$stmt_check->bind_param("ii", $dispositivo_id, $usuario_id);
$stmt_check->execute();
if ($stmt_check->get_result()->num_rows === 0) {
    $stmt_check->close();
    $conexao->close();
    enviar_resposta(403, 'erro', 'Operação não permitida. Este dispositivo não pertence à sua conta.');
}
$stmt_check->close();

// Insere a nova regra na base de dados
$sql = "INSERT INTO regras_alerta (dispositivo_id, usuario_id, parametro, condicao, valor) VALUES (?, ?, ?, ?, ?)";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("iissd", $dispositivo_id, $usuario_id, $parametro, $condicao, $valor);

if ($stmt->execute()) {
    enviar_resposta(201, 'sucesso', 'Regra de alerta criada com sucesso!');
} else {
    enviar_resposta(500, 'erro', 'Ocorreu um erro ao criar a regra de alerta: ' . $stmt->error);
}

$stmt->close();
$conexao->close();
?>