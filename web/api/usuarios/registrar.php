<?php
// Arquivo: servidor/web/api/usuarios/registrar.php
// Requisito Funcional: RF001 - O sistema deve permitir o cadastro de usuários com nome, e-mail e senha.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Inclui o arquivo de configuração do banco de dados. O __DIR__ garante que o caminho seja sempre correto.
require_once __DIR__ . '/../../config.php';

// Define o cabeçalho da resposta como JSON para que o frontend entenda.
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *"); // Permite requisições de qualquer origem (útil para desenvolvimento)
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");


// Função para enviar uma resposta padronizada em JSON.
function enviar_resposta($codigo_http, $status, $mensagem) {
    http_response_code($codigo_http);
    echo json_encode(['status' => $status, 'mensagem' => $mensagem]);
    exit;
}

// Verifica se o método da requisição é POST.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido. Utilize POST.');
}

// Conecta ao banco de dados usando as constantes do config.php
$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados: ' . $conexao->connect_error);
}

// Recebe e valida os dados enviados no corpo da requisição POST.
$dados = json_decode(file_get_contents("php://input"));

$nome = $dados->nome ?? '';
$sobrenome = $dados->sobrenome ?? '';
$email = $dados->email ?? '';
$senha = $dados->senha ?? '';

// Validação básica dos campos.
if (empty($nome) || empty($sobrenome) || empty($email) || empty($senha)) {
    enviar_resposta(400, 'erro', 'Todos os campos são obrigatórios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    enviar_resposta(400, 'erro', 'O formato do e-mail é inválido.');
}

// **SEGURANÇA: Cria um hash da senha.**
$senha_hash = password_hash($senha, PASSWORD_DEFAULT);

// Prepara a query SQL para inserir o novo usuário, prevenindo SQL Injection.
$sql = "INSERT INTO usuario (nome, sobrenome, email, senha) VALUES (?, ?, ?, ?)";
$stmt = $conexao->prepare($sql);

if ($stmt === false) {
    enviar_resposta(500, 'erro', 'Erro ao preparar a query SQL.');
}

// Associa os parâmetros à query. "ssss" significa que todos os 4 parâmetros são strings.
$stmt->bind_param("ssss", $nome, $sobrenome, $email, $senha_hash);

// Executa a query.
if ($stmt->execute()) {
    enviar_resposta(201, 'sucesso', 'Usuário cadastrado com sucesso!');
} else {
    // Verifica se o erro é de e-mail duplicado.
    if ($conexao->errno === 1062) {
        enviar_resposta(409, 'erro', 'Este e-mail já está cadastrado.');
    } else {
        enviar_resposta(500, 'erro', 'Erro ao cadastrar usuário: ' . $stmt->error);
    }
}

// Fecha a conexão.
$stmt->close();
$conexao->close();
?>