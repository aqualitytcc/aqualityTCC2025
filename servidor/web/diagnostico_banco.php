<?php
/**
 * Diagnóstico do Banco de Dados - Water Sense Mobile
 * Verifica estrutura atual e identifica problemas
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
    $diagnostico = [];
    
    // 1. Verifica estrutura da tabela usuario
    $sql_describe = "DESCRIBE usuario";
    $resultado = $conexao->query($sql_describe);
    
    $colunas_existentes = [];
    while ($row = $resultado->fetch_assoc()) {
        $colunas_existentes[] = [
            'campo' => $row['Field'],
            'tipo' => $row['Type'],
            'null' => $row['Null'],
            'key' => $row['Key'],
            'default' => $row['Default']
        ];
    }
    
    $diagnostico['tabela_usuario'] = $colunas_existentes;
    
    // 2. Verifica se foto_perfil existe
    $foto_perfil_existe = false;
    foreach ($colunas_existentes as $coluna) {
        if ($coluna['campo'] === 'foto_perfil') {
            $foto_perfil_existe = true;
            break;
        }
    }
    
    $diagnostico['foto_perfil_existe'] = $foto_perfil_existe;
    
    // 3. Conta usuários
    $sql_count = "SELECT COUNT(*) as total FROM usuario";
    $resultado_count = $conexao->query($sql_count);
    $total_usuarios = $resultado_count->fetch_assoc()['total'];
    
    $diagnostico['total_usuarios'] = $total_usuarios;
    
    // 4. Pega exemplo de usuário (id=1)
    if ($total_usuarios > 0) {
        $campos_select = "id, nome, sobrenome, email";
        if ($foto_perfil_existe) {
            $campos_select .= ", foto_perfil";
        }
        
        $sql_exemplo = "SELECT $campos_select FROM usuario LIMIT 1";
        $resultado_exemplo = $conexao->query($sql_exemplo);
        $usuario_exemplo = $resultado_exemplo->fetch_assoc();
        
        $diagnostico['usuario_exemplo'] = $usuario_exemplo;
    }
    
    // 5. Verifica outras tabelas necessárias
    $tabelas_necessarias = ['dispositivos', 'leitura'];
    $sql_tables = "SHOW TABLES";
    $resultado_tables = $conexao->query($sql_tables);
    
    $tabelas_existentes = [];
    while ($row = $resultado_tables->fetch_array()) {
        $tabelas_existentes[] = $row[0];
    }
    
    $diagnostico['tabelas_existentes'] = $tabelas_existentes;
    $diagnostico['tabelas_faltando'] = [];
    
    foreach ($tabelas_necessarias as $tabela) {
        if (!in_array($tabela, $tabelas_existentes)) {
            $diagnostico['tabelas_faltando'][] = $tabela;
        }
    }
    
    // 6. Status geral
    $diagnostico['status'] = [
        'banco_conectado' => true,
        'tabela_usuario_ok' => !empty($colunas_existentes),
        'foto_perfil_pronta' => $foto_perfil_existe,
        'usuarios_existem' => $total_usuarios > 0,
        'estrutura_completa' => empty($diagnostico['tabelas_faltando'])
    ];
    
    // 7. Recomendações
    $diagnostico['recomendacoes'] = [];
    
    if (!$foto_perfil_existe) {
        $diagnostico['recomendacoes'][] = "Executar: ALTER TABLE usuario ADD COLUMN foto_perfil VARCHAR(500) NULL";
    }
    
    if (!empty($diagnostico['tabelas_faltando'])) {
        $diagnostico['recomendacoes'][] = "Criar tabelas: " . implode(', ', $diagnostico['tabelas_faltando']);
    }
    
    if (empty($diagnostico['recomendacoes'])) {
        $diagnostico['recomendacoes'][] = "✅ Banco está pronto para foto de perfil!";
    }
    
    enviar_resposta(200, 'sucesso', 'Diagnóstico completo', $diagnostico);
    
} catch (Exception $e) {
    log_error('Erro no diagnóstico', ['erro' => $e->getMessage()]);
    enviar_resposta(500, 'erro', 'Erro no diagnóstico: ' . $e->getMessage());
}

$conexao->close();
?>