<?php
// Ficheiro: web/api/dispositivos/listar.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once __DIR__ . '/../../../config.php';
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

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

$usuario_id = $_SESSION['usuario_id'];

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// ATUALIZAÇÃO: Adicionado 'nome_dispositivo' à query SELECT
$sql = "SELECT d.*, MAX(l.data_hora) as ultima_leitura 
        FROM dispositivos d 
        LEFT JOIN leitura l ON d.id = l.dispositivo_id 
        WHERE d.usuario_id = ? 
        GROUP BY d.id";
$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$resultado = $stmt->get_result();

$dispositivos = [];
while ($linha = $resultado->fetch_assoc()) {
    $dispositivos[] = $linha;
}

enviar_resposta(200, 'sucesso', 'Dispositivos encontrados.', $dispositivos);

$stmt->close();
$conexao->close();
?>