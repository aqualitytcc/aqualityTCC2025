<?php
// Ficheiro: web/api/usuarios/atualizar_perfil.php
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$usuario_id = $_SESSION['usuario_id'];
$dados = json_decode(file_get_contents("php://input"));

// 2. Validar dados recebidos
$nome = $dados->nome ?? '';
$sobrenome = $dados->sobrenome ?? '';
$senha_antiga = $dados->senha_antiga ?? '';
$nova_senha = $dados->nova_senha ?? '';

if (empty($nome) || empty($sobrenome)) {
    enviar_resposta(400, 'erro', 'O nome e o sobrenome são obrigatórios.');
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// 3. Lógica de atualização
$sql_fetch = "SELECT senha FROM usuario WHERE id = ?";
$stmt_fetch = $conexao->prepare($sql_fetch);
$stmt_fetch->bind_param("i", $usuario_id);
$stmt_fetch->execute();
$resultado = $stmt_fetch->get_result();

if ($resultado->num_rows !== 1) {
    enviar_resposta(404, 'erro', 'Utilizador não encontrado.');
}

$usuario = $resultado->fetch_assoc();
$hash_senha_atual = $usuario['senha'];
$stmt_fetch->close();

// 4. Se uma nova senha foi fornecida, verifique a antiga
if (!empty($nova_senha)) {
    if (empty($senha_antiga) || !password_verify($senha_antiga, $hash_senha_atual)) {
        enviar_resposta(401, 'erro', 'A senha antiga está incorreta.');
    }
    
    // Se a senha antiga estiver correta, atualiza nome, sobrenome E a nova senha com hash
    $nova_senha_hash = password_hash($nova_senha, PASSWORD_DEFAULT);
    $sql_update = "UPDATE usuario SET nome = ?, sobrenome = ?, senha = ? WHERE id = ?";
    $stmt_update = $conexao->prepare($sql_update);
    $stmt_update->bind_param("sssi", $nome, $sobrenome, $nova_senha_hash, $usuario_id);
} else {
    // Se nenhuma senha nova foi fornecida, atualiza apenas o nome e sobrenome
    $sql_update = "UPDATE usuario SET nome = ?, sobrenome = ? WHERE id = ?";
    $stmt_update = $conexao->prepare($sql_update);
    $stmt_update->bind_param("ssi", $nome, $sobrenome, $usuario_id);
}

// Executa o update
if ($stmt_update->execute()) {
    // Atualiza o nome na sessão para refletir a mudança imediatamente
    $_SESSION['usuario_nome'] = $nome;
    enviar_resposta(200, 'sucesso', 'Perfil atualizado com sucesso!');
} else {
    enviar_resposta(500, 'erro', 'Ocorreu um erro ao atualizar o perfil.');
}

$stmt_update->close();
$conexao->close();
?>