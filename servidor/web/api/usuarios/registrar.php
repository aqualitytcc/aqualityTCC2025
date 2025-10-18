<?php
// Ficheiro: servidor/web/api/usuarios/registrar.php (VERSÃO ATUALIZADA)

require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../api_handler.php';
require_once __DIR__ . '/../../../enviar_email.php'; // <-- INCLUI O NOSSO NOVO SERVIÇO DE EMAIL

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.');
}

$dados = json_decode(file_get_contents("php://input"));
$nome = $dados->nome ?? '';
$sobrenome = $dados->sobrenome ?? '';
$email = $dados->email ?? '';
$senha = $dados->senha ?? '';

if (empty($nome) || empty($sobrenome) || empty($email) || empty($senha)) {
    enviar_resposta(400, 'erro', 'Todos os campos são obrigatórios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    enviar_resposta(400, 'erro', 'O formato do e-mail é inválido.');
}

// Inicia uma transação para garantir que o utilizador só é criado se o email for enviado
$conexao->begin_transaction();

try {
    // Verifica se o email já existe
    $stmt_check = $conexao->prepare("SELECT id FROM usuario WHERE email = ?");
    $stmt_check->bind_param("s", $email);
    $stmt_check->execute();
    if ($stmt_check->get_result()->num_rows > 0) {
        throw new Exception('Este e-mail já está cadastrado.', 409);
    }
    $stmt_check->close();

    // Gera o hash da senha e um token de verificação único
    $senha_hash = password_hash($senha, PASSWORD_DEFAULT);
    $token_verificacao = bin2hex(random_bytes(32)); // Gera um token seguro de 64 caracteres

    // Insere o novo utilizador com o token (e email_verificado_em como NULL)
    $stmt_insert = $conexao->prepare("INSERT INTO usuario (nome, sobrenome, email, senha, token_verificacao) VALUES (?, ?, ?, ?, ?)");
    $stmt_insert->bind_param("sssss", $nome, $sobrenome, $email, $senha_hash, $token_verificacao);
    
    if (!$stmt_insert->execute()) {
        throw new Exception('Erro ao criar o registro do utilizador.');
    }
    $stmt_insert->close();

    // Monta o link de verificação
    // ATENÇÃO: Terás de criar a página `verificar-email.html` no frontend.
    $url_verificacao = "http://" . $_SERVER['HTTP_HOST'] . "/verificar-email.html?token=" . $token_verificacao;

    // Monta o corpo do email em HTML
    $assunto = "Confirme o seu email no A-Quality";
    $corpo_html = "<h1>Bem-vindo ao A-Quality!</h1>
                   <p>Olá, $nome! Obrigado por se registar.</p>
                   <p>Por favor, clique no link abaixo para ativar a sua conta:</p>
                   <p><a href='$url_verificacao' style='padding: 10px 15px; background-color: #0077b6; color: white; text-decoration: none; border-radius: 5px;'>Confirmar Email</a></p>
                   <p>Se não conseguir clicar no botão, copie e cole o seguinte link no seu navegador:</p>
                   <p>$url_verificacao</p>
                   <br>
                   <p><em>Se não se registrou no nosso site, por favor ignore este email.</em></p>";

    // Tenta enviar o email
    if (!enviar_email($email, $nome, $assunto, $corpo_html)) {
        throw new Exception('Não foi possível enviar o email de confirmação. Por favor, tente novamente.');
    }

    // Se tudo correu bem (utilizador criado E email enviado), confirma a transação
    $conexao->commit();
    enviar_resposta(201, 'sucesso', 'Registro realizado com sucesso! Por favor, verifique o seu email para ativar a conta.');

} catch (Exception $e) {
    // Se algo falhou, desfaz a criação do utilizador
    $conexao->rollback();
    enviar_resposta($e->getCode() ?: 500, 'erro', $e->getMessage());
}

$conexao->close();
?>