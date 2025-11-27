<?php
/**
 * API para Atualizar Perfil do Usuário - Water Sense Mobile
 * Permite atualizar nome, email e senha do usuário
 */

require_once __DIR__ . '/../config.php';

// Configura CORS e headers
configurar_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido. Use POST.');
}

// Conecta ao banco de dados
$conexao = conectar_banco();
if (!$conexao) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.');
}

// Lê os dados JSON do corpo da requisição
$input = json_decode(file_get_contents('php://input'), true);

$usuario_id = $input['usuario_id'] ?? null;
$nome = $input['nome'] ?? null;
$sobrenome = $input['sobrenome'] ?? null;
$email = $input['email'] ?? null;
$nova_senha = $input['nova_senha'] ?? null;
$senha_atual = $input['senha_atual'] ?? null;

// Validação básica
if (!$usuario_id) {
    enviar_resposta(400, 'erro', 'ID do usuário é obrigatório.');
}

try {
    // Busca dados atuais do usuário
    $sql_usuario = "SELECT id, nome, sobrenome, email, senha FROM usuario WHERE id = ?";
    $stmt_usuario = $conexao->prepare($sql_usuario);
    
    if (!$stmt_usuario) {
        throw new Exception('Erro ao preparar consulta: ' . $conexao->error);
    }
    
    $stmt_usuario->bind_param("i", $usuario_id);
    $stmt_usuario->execute();
    $resultado = $stmt_usuario->get_result();
    
    if ($resultado->num_rows === 0) {
        enviar_resposta(404, 'erro', 'Usuário não encontrado.');
    }
    
    $usuario_atual = $resultado->fetch_assoc();
    
    // Valida email único (se está sendo alterado)
    if ($email && $email !== $usuario_atual['email']) {
        $sql_check_email = "SELECT id FROM usuario WHERE email = ? AND id != ?";
        $stmt_check = $conexao->prepare($sql_check_email);
        $stmt_check->bind_param("si", $email, $usuario_id);
        $stmt_check->execute();
        
        if ($stmt_check->get_result()->num_rows > 0) {
            enviar_resposta(409, 'erro', 'Este email já está sendo usado por outro usuário.');
        }
    }
    
    // Se vai alterar senha, valida senha atual
    if ($nova_senha) {
        if (!$senha_atual) {
            enviar_resposta(400, 'erro', 'Senha atual é obrigatória para alterar a senha.');
        }
        
        if (!password_verify($senha_atual, $usuario_atual['senha'])) {
            enviar_resposta(403, 'erro', 'Senha atual incorreta.');
        }
    }
    
    // Monta a query de atualização
    $campos_update = [];
    $valores = [];
    $tipos = '';
    
    if ($nome && $nome !== $usuario_atual['nome']) {
        $campos_update[] = "nome = ?";
        $valores[] = $nome;
        $tipos .= 's';
    }
    
    if ($sobrenome && $sobrenome !== $usuario_atual['sobrenome']) {
        $campos_update[] = "sobrenome = ?";
        $valores[] = $sobrenome;
        $tipos .= 's';
    }
    
    if ($email && $email !== $usuario_atual['email']) {
        $campos_update[] = "email = ?";
        $valores[] = $email;
        $tipos .= 's';
    }
    
    if ($nova_senha) {
        $campos_update[] = "senha = ?";
        $valores[] = password_hash($nova_senha, PASSWORD_DEFAULT);
        $tipos .= 's';
    }
    
    if (empty($campos_update)) {
        enviar_resposta(400, 'erro', 'Nenhum dado foi alterado.');
    }
    
    // Executa a atualização
    $sql_update = "UPDATE usuario SET " . implode(', ', $campos_update) . " WHERE id = ?";
    $valores[] = $usuario_id;
    $tipos .= 'i';
    
    $stmt_update = $conexao->prepare($sql_update);
    $stmt_update->bind_param($tipos, ...$valores);
    
    if (!$stmt_update->execute()) {
        throw new Exception('Erro ao atualizar perfil: ' . $stmt_update->error);
    }
    
    // Busca dados atualizados
    $sql_final = "SELECT id, nome, sobrenome, email FROM usuario WHERE id = ?";
    $stmt_final = $conexao->prepare($sql_final);
    $stmt_final->bind_param("i", $usuario_id);
    $stmt_final->execute();
    $usuario_atualizado = $stmt_final->get_result()->fetch_assoc();
    
    $dados_resposta = [
        'id' => intval($usuario_atualizado['id']),
        'nome' => $usuario_atualizado['nome'],
        'sobrenome' => $usuario_atualizado['sobrenome'],
        'nome_completo' => trim($usuario_atualizado['nome'] . ' ' . $usuario_atualizado['sobrenome']),
        'email' => $usuario_atualizado['email'],
        'senha_alterada' => !empty($nova_senha)
    ];
    
    log_error('Perfil atualizado com sucesso', [
        'usuario_id' => $usuario_id,
        'campos_alterados' => $campos_update,
        'senha_alterada' => !empty($nova_senha)
    ]);
    
    enviar_resposta(200, 'sucesso', 'Perfil atualizado com sucesso!', $dados_resposta);
    
} catch (Exception $e) {
    log_error('Erro ao atualizar perfil', [
        'erro' => $e->getMessage(),
        'usuario_id' => $usuario_id
    ]);
    
    enviar_resposta(500, 'erro', 'Erro interno do servidor: ' . $e->getMessage());
}

$conexao->close();
?>