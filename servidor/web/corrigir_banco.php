<?php
/**
 * Corrigir Banco - Water Sense Mobile
 * Adiciona coluna foto_perfil de forma segura
 */

require_once __DIR__ . '/app/api_mobile/config.php';

// Configura CORS e headers
configurar_cors();

// Conecta ao banco de dados
$conexao = conectar_banco();
if (!$conexao) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.');
}

try {
    $resultado = [];
    
    // Verifica se a coluna foto_perfil já existe
    $sql_check = "SHOW COLUMNS FROM usuario LIKE 'foto_perfil'";
    $check_result = $conexao->query($sql_check);
    
    if ($check_result->num_rows > 0) {
        $resultado['status'] = 'ja_existe';
        $resultado['mensagem'] = 'Coluna foto_perfil já existe no banco!';
    } else {
        // Adiciona a coluna foto_perfil
        $sql_add = "ALTER TABLE usuario ADD COLUMN foto_perfil VARCHAR(500) NULL COMMENT 'URL da foto de perfil'";
        
        if ($conexao->query($sql_add)) {
            $resultado['status'] = 'adicionado';
            $resultado['mensagem'] = 'Coluna foto_perfil adicionada com sucesso!';
        } else {
            throw new Exception('Erro ao adicionar coluna: ' . $conexao->error);
        }
    }
    
    // Verifica a estrutura final
    $sql_describe = "DESCRIBE usuario";
    $describe_result = $conexao->query($sql_describe);
    
    $estrutura = [];
    while ($row = $describe_result->fetch_assoc()) {
        $estrutura[] = [
            'campo' => $row['Field'],
            'tipo' => $row['Type']
        ];
    }
    
    $resultado['estrutura_final'] = $estrutura;
    
    enviar_resposta(200, 'sucesso', $resultado['mensagem'], $resultado);
    
} catch (Exception $e) {
    log_error('Erro ao corrigir banco', ['erro' => $e->getMessage()]);
    enviar_resposta(500, 'erro', 'Erro ao corrigir banco: ' . $e->getMessage());
}

$conexao->close();
?>