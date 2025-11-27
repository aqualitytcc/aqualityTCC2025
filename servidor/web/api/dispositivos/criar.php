<?php
// Ficheiro: web/api/dispositivos/criar.php
require_once __DIR__ . '/../../../config.php';
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

function enviar_resposta($codigo, $status, $mensagem, $dados = null) {
    http_response_code($codigo);
    $resposta = ['status' => $status, 'mensagem' => $mensagem];
    if ($dados) {
        $resposta['dados'] = $dados;
    }
    echo json_encode($resposta);
    exit;
}

if (!isset($_SESSION['usuario_id'])) {
    enviar_resposta(403, 'erro', 'Acesso negado. Por favor, faça login primeiro.');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$usuario_id = $_SESSION['usuario_id'];
$dados = json_decode(file_get_contents("php://input"));

// Lê os dados do formulário
$nome_dispositivo = $dados->nome_dispositivo ?? '';
$localizacao = $dados->localizacao ?? '';
$codigo_verificacao = $dados->codigo_verificacao ?? '';

if (empty($nome_dispositivo) || empty($codigo_verificacao)) {
    enviar_resposta(400, 'erro', 'O Nome do Dispositivo e o Identificador Único são obrigatórios.');
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// ATUALIZAÇÃO: Agora o UPDATE inclui a nova coluna 'nome_dispositivo'
$sql = "UPDATE dispositivos SET usuario_id = ?, nome_dispositivo = ?, localizacao = ? WHERE codigo_verificacao = ? AND usuario_id IS NULL";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("isss", $usuario_id, $nome_dispositivo, $localizacao, $codigo_verificacao);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        enviar_resposta(200, 'sucesso', 'Dispositivo associado com sucesso!');
    } else {
        enviar_resposta(404, 'erro', 'Nenhum dispositivo encontrado com este identificador ou o dispositivo já foi associado por outro usuário.');
    }
} else {
    enviar_resposta(500, 'erro', 'Ocorreu um erro ao associar o dispositivo.');
}

$stmt->close();
$conexao->close();
?>