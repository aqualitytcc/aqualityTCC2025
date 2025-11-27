<?php
// Ficheiro: servidor/web/api/usuarios/pedir_redefinicao.php
require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../api_handler.php';
require_once __DIR__ . '/../../../enviar_email.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$dados = json_decode(file_get_contents("php://input"));
$email = $dados->email ?? '';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    enviar_resposta(400, 'erro', 'Por favor, insira um endereço de email válido.');
}

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

try {
    // 1. Verifica se o utilizador existe E se já confirmou o seu email
    $stmt = $conexao->prepare("SELECT id, nome, email, email_verificado_em FROM usuario WHERE email = ? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 0) {
        // Por segurança, não informamos se o email existe ou não.
        enviar_resposta(200, 'sucesso', 'Se existir uma conta associada a este email, enviaremos as instruções para redefinir a sua senha.');
    }

    $utilizador = $resultado->fetch_assoc();

    if ($utilizador['email_verificado_em'] === null) {
        enviar_resposta(403, 'erro', 'Esta conta ainda não foi ativada. Por favor, verifique o seu email de confirmação primeiro.');
    }

    // 2. Gera um token e define uma data de expiração (ex: 1 hora)
    $token = bin2hex(random_bytes(32));
    $expira_em = new DateTime();
    $expira_em->add(new DateInterval('PT1H')); // P (Período) T (Tempo) 1H (1 Hora)
    $data_expiracao_formatada = $expira_em->format('Y-m-d H:i:s');

    // 3. Guarda o token e a data de expiração na base de dados
    $stmt_update = $conexao->prepare("UPDATE usuario SET token_redefinicao = ?, token_redefinicao_expira_em = ? WHERE id = ?");
    $stmt_update->bind_param("ssi", $token, $data_expiracao_formatada, $utilizador['id']);
    if (!$stmt_update->execute()) {
        throw new Exception('Não foi possível gerar o pedido de redefinição. Tente novamente.');
    }

    // 4. Envia o email
    $url_redefinicao = "http://" . $_SERVER['HTTP_HOST'] . "/redefinir-senha.html?token=" . $token;

    $assunto = "Redefinição de Senha - A-Quality";
    $corpo_html = "<h1>Pedido de Redefinição de Senha</h1>
                   <p>Olá, {$utilizador['nome']}!</p>
                   <p>Recebemos um pedido para redefinir a sua senha na plataforma A-Quality. Se não foi você, por favor ignore este email.</p>
                   <p>Para criar uma nova senha, clique no link abaixo. Este link é válido por 1 hora.</p>
                   <p><a href='$url_redefinicao' style='padding: 10px 15px; background-color: #0077b6; color: white; text-decoration: none; border-radius: 5px;'>Redefinir Senha</a></p>
                   <p>Se não conseguir clicar no botão, copie e cole o seguinte link no seu navegador:</p>
                   <p>$url_redefinicao</p>";

    if (!enviar_email($utilizador['email'], $utilizador['nome'], $assunto, $corpo_html)) {
        throw new Exception('Não foi possível enviar o email de redefinição. Tente novamente mais tarde.');
    }

    enviar_resposta(200, 'sucesso', 'Se existir uma conta associada a este email, enviaremos as instruções para redefinir a sua senha.');

} catch (Exception $e) {
    enviar_resposta(500, 'erro', $e->getMessage());
}

$conexao->close();
?>