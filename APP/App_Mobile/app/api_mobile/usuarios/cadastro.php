<?php
/**
 * API de Cadastro - Water Sense Mobile
 * Endpoint para registro de novos usuários
 * Adaptado para a estrutura do banco existente
 */

require_once __DIR__ . '/../config.php';

// Configura CORS e headers
configurar_cors();

/**
 * Verifica se o método da requisição é POST
 */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido. Use POST.');
}

// Conecta ao banco de dados
$conexao = conectar_banco();
if (!$conexao) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.');
}

// Recebe e valida os dados enviados
$dados = json_decode(file_get_contents("php://input"), true);

// Validação dos campos obrigatórios
$campos_obrigatorios = ['nome', 'sobrenome', 'email', 'senha'];
foreach ($campos_obrigatorios as $campo) {
    if (!isset($dados[$campo]) || empty(trim($dados[$campo]))) {
        enviar_resposta(400, 'erro', "O campo '$campo' é obrigatório.");
    }
}

$nome = trim($dados['nome']);
$sobrenome = trim($dados['sobrenome']);
$email = trim($dados['email']);
$senha = $dados['senha'];

// Validações específicas
if (strlen($nome) < 2) {
    enviar_resposta(400, 'erro', 'Nome deve ter pelo menos 2 caracteres.');
}

if (strlen($sobrenome) < 2) {
    enviar_resposta(400, 'erro', 'Sobrenome deve ter pelo menos 2 caracteres.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    enviar_resposta(400, 'erro', 'Formato de email inválido.');
}

if (strlen($senha) < 6) {
    enviar_resposta(400, 'erro', 'Senha deve ter pelo menos 6 caracteres.');
}

// Validação de força da senha
if (!preg_match('/^(?=.*[a-z])(?=.*\d)/', $senha)) {
    enviar_resposta(400, 'erro', 'Senha deve conter pelo menos uma letra minúscula e um número.');
}

try {
    // Verifica se o email já existe
    $sql_check = "SELECT id FROM usuario WHERE email = ?";
    $stmt_check = $conexao->prepare($sql_check);
    
    if (!$stmt_check) {
        throw new Exception('Erro ao preparar consulta de verificação: ' . $conexao->error);
    }
    
    $stmt_check->bind_param("s", $email);
    $stmt_check->execute();
    $resultado_check = $stmt_check->get_result();
    
    if ($resultado_check->num_rows > 0) {
        enviar_resposta(409, 'erro', 'Este email já está cadastrado. Tente fazer login ou use outro email.');
    }
    
    // Cria hash seguro da senha
    $senha_hash = password_hash($senha, PASSWORD_DEFAULT);
    
    // Insere o novo usuário
    $sql_insert = "INSERT INTO usuario (nome, sobrenome, email, senha) VALUES (?, ?, ?, ?)";
    $stmt_insert = $conexao->prepare($sql_insert);
    
    if (!$stmt_insert) {
        throw new Exception('Erro ao preparar consulta de inserção: ' . $conexao->error);
    }
    
    $stmt_insert->bind_param("ssss", $nome, $sobrenome, $email, $senha_hash);
    
    if ($stmt_insert->execute()) {
        $novo_usuario_id = $conexao->insert_id;
        
        // Log de cadastro bem-sucedido
        log_error('Novo usuário cadastrado com sucesso', [
            'usuario_id' => $novo_usuario_id,
            'nome' => $nome,
            'sobrenome' => $sobrenome,
            'email' => $email,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'desconhecido'
        ]);
        
        // Retorna dados do usuário criado (sem a senha)
        $usuario_criado = [
            'id' => $novo_usuario_id,
            'nome' => $nome,
            'sobrenome' => $sobrenome,
            'email' => $email
        ];
        
        enviar_resposta(201, 'sucesso', 'Usuário cadastrado com sucesso!', $usuario_criado);
        
    } else {
        throw new Exception('Erro ao inserir usuário: ' . $stmt_insert->error);
    }
    
} catch (Exception $e) {
    log_error('Erro no processo de cadastro', [
        'erro' => $e->getMessage(),
        'email' => $email,
        'nome' => $nome
    ]);
    
    // Verifica se é erro de email duplicado (caso não tenha sido pego antes)
    if (strpos($e->getMessage(), 'Duplicate entry') !== false || 
        strpos($e->getMessage(), 'email') !== false) {
        enviar_resposta(409, 'erro', 'Este email já está cadastrado.');
    } else {
        enviar_resposta(500, 'erro', 'Erro interno do servidor. Tente novamente.');
    }
    
} finally {
    if (isset($stmt_check)) {
        $stmt_check->close();
    }
    if (isset($stmt_insert)) {
        $stmt_insert->close();
    }
    $conexao->close();
}
?>