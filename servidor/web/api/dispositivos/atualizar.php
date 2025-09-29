<?php
// Ficheiro: web/api/dispositivos/atualizar.php (VERSÃO CORRIGIDA)
require_once __DIR__ . '/../../../config.php';
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
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
$modo_alerta = $dados->modo_alerta ?? 'personalizado'; // Novo campo

if (empty($dispositivo_id)) {
    enviar_resposta(400, 'erro', 'O ID do Dispositivo é obrigatório.');
}
if (!in_array($modo_alerta, ['padrão', 'personalizado'])) {
    enviar_resposta(400, 'erro', 'Modo de alerta inválido.');
}

// 3. Conectar à base de dados
$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// 4. Atualizar o dispositivo
// A query SQL espera 5 parâmetros no total
$sql = "UPDATE dispositivos SET nome_dispositivo = ?, localizacao = ?, modo_alerta = ? WHERE id = ? AND usuario_id = ?";
$stmt = $conexao->prepare($sql);

// CORREÇÃO: A linha abaixo estava errada. Agora tem 5 tipos ("sssii") e 5 variáveis.
$stmt->bind_param("sssii", $nome_dispositivo, $localizacao, $modo_alerta, $dispositivo_id, $usuario_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        enviar_resposta(200, 'sucesso', 'Dispositivo atualizado com sucesso!');
    } else {
        // Se nenhuma linha foi afetada, pode ser que o utilizador não mudou nada e clicou em salvar.
        // Ou o dispositivo não foi encontrado. Enviamos uma mensagem neutra.
        enviar_resposta(200, 'sucesso', 'Nenhuma alteração detectada ou dispositivo já estava atualizado.');
    }
} else {
    enviar_resposta(500, 'erro', 'Ocorreu um erro ao atualizar o dispositivo.');
}

$stmt->close();
$conexao->close();
?>