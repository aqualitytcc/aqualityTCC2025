<?php
/**
 * Migração Inteligente - Water Sense Mobile  
 * Adiciona APENAS coluna de foto_perfil (SEM telefone)
 */

require_once __DIR__ . '/config.php';

// Configura CORS e headers
configurar_cors();

// Conecta ao banco de dados
$conexao = conectar_banco();
if (!$conexao) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.');
}

try {
    $migrations_executadas = [];
    $erros = [];
    
    // Verifica estrutura atual da tabela usuario
    $sql_describe = "DESCRIBE usuario";
    $resultado = $conexao->query($sql_describe);
    
    $colunas_existentes = [];
    while ($row = $resultado->fetch_assoc()) {
        $colunas_existentes[] = $row['Field'];
    }
    
    // Migração 1: Adicionar coluna foto_perfil
    if (!in_array('foto_perfil', $colunas_existentes)) {
        $sql_foto = "ALTER TABLE usuario ADD COLUMN foto_perfil VARCHAR(500) NULL COMMENT 'URL da foto de perfil'";
        if ($conexao->query($sql_foto)) {
            $migrations_executadas[] = "✅ Coluna 'foto_perfil' adicionada com sucesso";
        } else {
            $erros[] = "❌ Erro ao adicionar coluna 'foto_perfil': " . $conexao->error;
        }
    } else {
        $migrations_executadas[] = "ℹ️ Coluna 'foto_perfil' já existe";
    }
    
    // Migração 2: Criar diretório de uploads
    $diretorio_uploads = __DIR__ . '/uploads/perfil/';
    if (!is_dir($diretorio_uploads)) {
        if (mkdir($diretorio_uploads, 0755, true)) {
            $migrations_executadas[] = "✅ Diretório de uploads criado: " . $diretorio_uploads;
        } else {
            $erros[] = "❌ Erro ao criar diretório de uploads";
        }
    } else {
        $migrations_executadas[] = "ℹ️ Diretório de uploads já existe";
    }
    
    // Migração 3: Criar índices para performance
    $indices_necessarios = [
        'idx_usuario_foto' => "CREATE INDEX idx_usuario_foto ON usuario(foto_perfil)"
    ];
    
    foreach ($indices_necessarios as $nome_indice => $sql_indice) {
        // Verifica se o índice já existe
        $sql_check_index = "SHOW INDEX FROM usuario WHERE Key_name = '$nome_indice'";
        $resultado_index = $conexao->query($sql_check_index);
        
        if ($resultado_index->num_rows === 0) {
            if ($conexao->query($sql_indice)) {
                $migrations_executadas[] = "✅ Índice '$nome_indice' criado";
            } else {
                $erros[] = "❌ Erro ao criar índice '$nome_indice': " . $conexao->error;
            }
        } else {
            $migrations_executadas[] = "ℹ️ Índice '$nome_indice' já existe";
        }
    }
    
    // Verificação final da estrutura
    $sql_describe_final = "DESCRIBE usuario";
    $resultado_final = $conexao->query($sql_describe_final);
    
    $estrutura_final = [];
    while ($row = $resultado_final->fetch_assoc()) {
        $estrutura_final[] = [
            'campo' => $row['Field'],
            'tipo' => $row['Type'],
            'null' => $row['Null'],
            'key' => $row['Key'],
            'default' => $row['Default'],
            'extra' => $row['Extra']
        ];
    }
    
    $dados_resposta = [
        'migrations_executadas' => $migrations_executadas,
        'erros' => $erros,
        'estrutura_final' => $estrutura_final,
        'total_migrations' => count($migrations_executadas),
        'total_erros' => count($erros),
        'status_geral' => count($erros) === 0 ? 'sucesso' : 'parcial'
    ];
    
    log_error('Migração de banco executada', [
        'migrations' => count($migrations_executadas),
        'erros' => count($erros)
    ]);
    
    if (count($erros) === 0) {
        enviar_resposta(200, 'sucesso', 'Todas as migrações foram executadas com sucesso', $dados_resposta);
    } else {
        enviar_resposta(206, 'parcial', 'Algumas migrações falharam', $dados_resposta);
    }
    
} catch (Exception $e) {
    log_error('Erro na migração de banco', [
        'erro' => $e->getMessage(),
        'linha' => __LINE__
    ]);
    
    enviar_resposta(500, 'erro', 'Erro interno durante migração: ' . $e->getMessage());
}

$conexao->close();
?>