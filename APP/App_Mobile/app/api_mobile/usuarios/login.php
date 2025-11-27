<?php
/**
 * API de Login - Water Sense Mobile
 * Endpoint para autenticação de usuários
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

// Validação básica dos campos
if (!isset($dados['email']) || !isset($dados['senha'])) {
    enviar_resposta(400, 'erro', 'Email e senha são obrigatórios.');
}

$email = trim($dados['email']);
$senha = $dados['senha'];

// Validação de formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    enviar_resposta(400, 'erro', 'Formato de email inválido.');
}

if (empty($senha)) {
    enviar_resposta(400, 'erro', 'Senha não pode estar vazia.');
}

try {
    // Busca o usuário pelo email na estrutura existente
    $sql = "SELECT id, nome, sobrenome, email, senha FROM usuario WHERE email = ? LIMIT 1";
    $stmt = $conexao->prepare($sql);
    
    if (!$stmt) {
        throw new Exception('Erro ao preparar consulta: ' . $conexao->error);
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $resultado = $stmt->get_result();
    
    if ($resultado->num_rows === 1) {
        $usuario = $resultado->fetch_assoc();
        
        // Verifica a senha
        // Primeiro tenta verificar com hash bcrypt
        $senha_valida = false;
        
        if (password_verify($senha, $usuario['senha'])) {
            // Senha com hash bcrypt válida
            $senha_valida = true;
        } elseif ($usuario['senha'] === $senha) {
            // Senha em texto simples (para compatibilidade temporária)
            $senha_valida = true;
            
            // Atualiza para hash bcrypt
            $nova_senha_hash = password_hash($senha, PASSWORD_DEFAULT);
            $update_sql = "UPDATE usuario SET senha = ? WHERE id = ?";
            $update_stmt = $conexao->prepare($update_sql);
            $update_stmt->bind_param("si", $nova_senha_hash, $usuario['id']);
            $update_stmt->execute();
            
            log_error('Senha atualizada para hash bcrypt', ['usuario_id' => $usuario['id']]);
        }
        
        if ($senha_valida) {
            // Remove a senha do retorno por segurança
            unset($usuario['senha']);
            
            // Log de login bem-sucedido
            log_error('Login realizado com sucesso', [
                'usuario_id' => $usuario['id'],
                'email' => $email,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'desconhecido'
            ]);
            
            enviar_resposta(200, 'sucesso', 'Login realizado com sucesso!', $usuario);
        } else {
            // Senha incorreta
            log_error('Tentativa de login com senha incorreta', [
                'email' => $email,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'desconhecido'
            ]);
            
            enviar_resposta(401, 'erro', 'Email ou senha incorretos.');
        }
    } else {
        // Usuário não encontrado
        log_error('Tentativa de login com email inexistente', [
            'email' => $email,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'desconhecido'
        ]);
        
        enviar_resposta(401, 'erro', 'Email ou senha incorretos.');
    }
    
} catch (Exception $e) {
    log_error('Erro no processo de login', [
        'erro' => $e->getMessage(),
        'email' => $email
    ]);
    
    enviar_resposta(500, 'erro', 'Erro interno do servidor. Tente novamente.');
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($update_stmt)) {
        $update_stmt->close();
    }
    $conexao->close();
}
?>