<?php
// Ficheiro: web/api/alertas/listar.php
require_once __DIR__ . '/../../../config.php';
session_start();

header("Content-Type: application/json; charset=UTF-8");

function enviar_resposta($codigo, $status, $mensagem, $dados = null) {
    http_response_code($codigo);
    $resposta = ['status' => $status, 'mensagem' => $mensagem];
    if ($dados !== null) {
        $resposta['dados'] = $dados;
    }
    echo json_encode($resposta);
    exit;
}

if (!isset($_SESSION['usuario_id'])) {
    enviar_resposta(403, 'erro', 'Acesso negado.');
}

$usuario_id = $_SESSION['usuario_id'];
$dispositivo_id = filter_input(INPUT_GET, 'dispositivo_id', FILTER_VALIDATE_INT);

if (!$dispositivo_id) {
    enviar_resposta(400, 'erro', 'O ID do dispositivo é obrigatório.');
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// A query busca apenas as regras que pertencem ao dispositivo E ao utilizador logado
$sql = "SELECT id, parametro, condicao, valor FROM regras_alerta WHERE dispositivo_id = ? AND usuario_id = ?";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("ii", $dispositivo_id, $usuario_id);
$stmt->execute();
$resultado = $stmt->get_result();

$regras = [];
while ($linha = $resultado->fetch_assoc()) {
    $regras[] = $linha;
}

enviar_resposta(200, 'sucesso', 'Regras encontradas.', $regras);

$stmt->close();
$conexao->close();
?>