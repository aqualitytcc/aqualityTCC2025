<?php
/**
 * API para Atualização de Perfil do Usuário - Water Sense Mobile (CORRIGIDA)
 * Compatível com estrutura real do banco
 */

require_once __DIR__ . '/../config.php';

// Configura CORS e headers
configurar_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    enviar_resposta(405, 'erro', 'Método não permitido. Use PUT.');
}

// Conecta ao banco de dados
$conexao = conectar_banco();
if (!$conexao) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.');
}

// Recebe os dados do corpo da requisição
$input = file_get_contents("php://input");
$dados = json_decode($input, true);

if (!$dados) {
    enviar_resposta(400, 'erro', 'Dados inválidos enviados.');
}

$usuario_id = $dados['usuario_id'] ?? null;

if (!$usuario_id) {
    enviar_resposta(400, 'erro', 'ID do usuário é obrigatório.');
}

try {
    // Verifica se o usuário existe (usando apenas colunas que existem)
    $sql_check = "SELECT id, email FROM usuario WHERE id = ?";
    $stmt_check = $conexao->prepare($sql_check);
    
    if (!$stmt_check) {
        throw new Exception('Erro ao preparar consulta: ' . $conexao->error);
    }
    
    $stmt_check->bind_param("i", $usuario_id);
    $stmt_check->execute();
    $resultado = $stmt_check->get_result();
    
    if ($resultado->num_rows === 0) {
        enviar_resposta(404, 'erro', 'Usuário não encontrado.');
    }
    
    $usuario_atual = $resultado->fetch_assoc();
    
    // Campos que podem ser atualizados
    $updates = [];
    $params = [];
    $types = "";
    
    // Atualização do nome
    if (isset($dados['nome']) && !empty(trim($dados['nome']))) {
        $nome = trim($dados['nome']);
        if (strlen($nome) < 2) {
            enviar_resposta(400, 'erro', 'Nome deve ter pelo menos 2 caracteres.');
        }
        $updates[] = "nome = ?";
        $params[] = $nome;
        $types .= "s";
    }
    
    // Atualização do sobrenome
    if (isset($dados['sobrenome']) && !empty(trim($dados['sobrenome']))) {
        $sobrenome = trim($dados['sobrenome']);
        if (strlen($sobrenome) < 2) {
            enviar_resposta(400, 'erro', 'Sobrenome deve ter pelo menos 2 caracteres.');
        }
        $updates[] = "sobrenome = ?";
        $params[] = $sobrenome;
        $types .= "s";
    }
    
    // Atualização do email
    if (isset($dados['email']) && !empty(trim($dados['email']))) {
        $email = trim(strtolower($dados['email']));
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            enviar_resposta(400, 'erro', 'Email inválido.');
        }
        
        // Verifica se o email já está em uso por outro usuário
        if ($email !== $usuario_atual['email']) {
            $sql_email_check = "SELECT id FROM usuario WHERE email = ? AND id != ?";
            $stmt_email = $conexao->prepare($sql_email_check);
            $stmt_email->bind_param("si", $email, $usuario_id);
            $stmt_email->execute();
            
            if ($stmt_email->get_result()->num_rows > 0) {
                enviar_resposta(409, 'erro', 'Este email já está sendo usado por outro usuário.');
            }
        }
        
        $updates[] = "email = ?";
        $params[] = $email;
        $types .= "s";
    }
    
    // Atualização da senha
    if (isset($dados['nova_senha']) && !empty($dados['nova_senha'])) {
        $nova_senha = $dados['nova_senha'];
        $senha_atual = $dados['senha_atual'] ?? '';
        
        if (empty($senha_atual)) {
            enviar_resposta(400, 'erro', 'Senha atual é obrigatória para alterar a senha.');
        }
        
        // Verifica a senha atual
        $sql_senha = "SELECT senha FROM usuario WHERE id = ?";
        $stmt_senha = $conexao->prepare($sql_senha);
        $stmt_senha->bind_param("i", $usuario_id);
        $stmt_senha->execute();
        $senha_bd = $stmt_senha->get_result()->fetch_assoc()['senha'];
        
        if (!password_verify($senha_atual, $senha_bd)) {
            enviar_resposta(400, 'erro', 'Senha atual incorreta.');
        }
        
        // Valida nova senha
        if (strlen($nova_senha) < 6) {
            enviar_resposta(400, 'erro', 'Nova senha deve ter pelo menos 6 caracteres.');
        }
        
        $senha_hash = password_hash($nova_senha, PASSWORD_DEFAULT);
        $updates[] = "senha = ?";
        $params[] = $senha_hash;
        $types .= "s";
    }
    
    // Atualização da foto de perfil (se a coluna existir)
    if (isset($dados['foto_perfil'])) {
        $foto_perfil = $dados['foto_perfil'];
        
        // Verifica se a coluna foto_perfil existe
        $sql_check_column = "SHOW COLUMNS FROM usuario LIKE 'foto_perfil'";
        $resultado_check_column = $conexao->query($sql_check_column);
        
        if ($resultado_check_column && $resultado_check_column->num_rows > 0) {
            // Se for uma string vazia, remove a foto
            if (empty($foto_perfil)) {
                $updates[] = "foto_perfil = NULL";
            } else {
                // Valida se é uma URL válida ou um caminho válido
                if (filter_var($foto_perfil, FILTER_VALIDATE_URL) || strpos($foto_perfil, '/') === 0) {
                    $updates[] = "foto_perfil = ?";
                    $params[] = $foto_perfil;
                    $types .= "s";
                } else {
                    enviar_resposta(400, 'erro', 'URL da foto de perfil inválida.');
                }
            }
        }
    }
    
    if (empty($updates)) {
        enviar_resposta(400, 'erro', 'Nenhum campo válido para atualizar.');
    }
    
    // Executa a atualização
    $sql_update = "UPDATE usuario SET " . implode(', ', $updates) . " WHERE id = ?";
    $params[] = $usuario_id;
    $types .= "i";
    
    $stmt_update = $conexao->prepare($sql_update);
    
    if (!$stmt_update) {
        throw new Exception('Erro ao preparar atualização: ' . $conexao->error);
    }
    
    $stmt_update->bind_param($types, ...$params);
    
    if ($stmt_update->execute()) {
        // Busca os dados atualizados (apenas campos que existem)
        $sql_updated = "SELECT id, nome, sobrenome, email FROM usuario WHERE id = ?";
        $stmt_updated = $conexao->prepare($sql_updated);
        $stmt_updated->bind_param("i", $usuario_id);
        $stmt_updated->execute();
        $usuario_atualizado = $stmt_updated->get_result()->fetch_assoc();
        
        // Tenta buscar foto_perfil separadamente
        $foto_perfil = null;
        try {
            $sql_foto = "SELECT foto_perfil FROM usuario WHERE id = ?";
            $stmt_foto = $conexao->prepare($sql_foto);
            $stmt_foto->bind_param("i", $usuario_id);
            $stmt_foto->execute();
            $resultado_foto = $stmt_foto->get_result();
            if ($resultado_foto->num_rows > 0) {
                $row_foto = $resultado_foto->fetch_assoc();
                $foto_perfil = $row_foto['foto_perfil'];
            }
        } catch (Exception $e) {
            $foto_perfil = null;
        }
        
        $dados_resposta = [
            'id' => intval($usuario_atualizado['id']),
            'nome' => $usuario_atualizado['nome'],
            'sobrenome' => $usuario_atualizado['sobrenome'],
            'nome_completo' => trim($usuario_atualizado['nome'] . ' ' . $usuario_atualizado['sobrenome']),
            'email' => $usuario_atualizado['email'],
            'foto_perfil' => $foto_perfil,
            'data_criacao' => date('Y-m-d H:i:s')
        ];
        
        log_error('Perfil atualizado com sucesso (versão corrigida)', [
            'usuario_id' => $usuario_id,
            'campos_atualizados' => array_keys($dados)
        ]);
        
        enviar_resposta(200, 'sucesso', 'Perfil atualizado com sucesso', $dados_resposta);
        
    } else {
        throw new Exception('Erro ao atualizar perfil: ' . $stmt_update->error);
    }
    
} catch (Exception $e) {
    log_error('Erro ao atualizar perfil (versão corrigida)', [
        'erro' => $e->getMessage(),
        'usuario_id' => $usuario_id,
        'linha' => $e->getLine()
    ]);
    
    enviar_resposta(500, 'erro', 'Erro interno do servidor: ' . $e->getMessage());
}

$conexao->close();
?>