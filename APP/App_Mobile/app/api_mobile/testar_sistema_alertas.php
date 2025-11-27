<?php
/**
 * Script de teste para verificar se o sistema de alertas está funcionando
 * Execute este arquivo para testar todas as funcionalidades
 */

require_once __DIR__ . '/config.php';

echo "🧪 Testando Sistema de Alertas\n";
echo "==============================\n\n";

try {
    $conexao = conectar_banco();
    if (!$conexao) {
        throw new Exception('Falha na conexão com o banco de dados');
    }
    
    // 1. Verificar se as tabelas existem
    echo "1. Verificando estrutura do banco...\n";
    
    $tabelas = ['alertas', 'regras_alerta', 'dispositivos', 'usuario'];
    foreach ($tabelas as $tabela) {
        $sql = "SHOW TABLES LIKE '$tabela'";
        $resultado = $conexao->query($sql);
        if ($resultado && $resultado->num_rows > 0) {
            echo "✅ Tabela '$tabela' existe\n";
        } else {
            echo "❌ Tabela '$tabela' não encontrada\n";
        }
    }
    
    // 2. Criar regras de exemplo
    echo "\n2. Criando regras de alerta de exemplo...\n";
    
    $sql_regras = "INSERT IGNORE INTO regras_alerta (usuario_id, dispositivo_id, parametro, condicao, valor, data_criacao) VALUES
        (1, 1, 'temperatura', 'maior_que', 30.0, NOW()),
        (1, 1, 'ph', 'menor_que', 6.5, NOW()),
        (1, 1, 'turbidez', 'maior_que', 5.0, NOW()),
        (1, 1, 'condutividade', 'maior_que', 2.0, NOW())";
    
    if ($conexao->query($sql_regras)) {
        echo "✅ Regras criadas com sucesso\n";
    } else {
        echo "⚠️ Algumas regras já existem\n";
    }
    
    // 3. Criar alertas de exemplo
    echo "\n3. Criando alertas de exemplo...\n";
    
    $sql_alerta = "INSERT INTO alertas (
        usuario_id, dispositivo_id, regra_id, tipo, nivel, titulo, mensagem, 
        valor_atual, valor_limite, lido, resolvido, data_criacao
    ) VALUES (1, 1, 1, 'qualidade_agua', 'warning', 'Temperatura Elevado', 
    'Valor de temperatura acima do limite: 32.5°C (limite: 30.0°C) no dispositivo Aquality01.', 
    32.5, 30.0, 0, 0, NOW())";
    
    if ($conexao->query($sql_alerta)) {
        echo "✅ Alerta de exemplo criado\n";
    } else {
        echo "❌ Erro ao criar alerta: " . $conexao->error . "\n";
    }
    
    // 4. Testar API de listagem
    echo "\n4. Testando API de listagem...\n";
    
    $sql_test = "SELECT COUNT(*) as total FROM alertas WHERE usuario_id = 1";
    $resultado = $conexao->query($sql_test);
    $total = $resultado->fetch_assoc()['total'];
    echo "📊 Total de alertas para usuário 1: $total\n";
    
    // 5. Testar processamento de alertas
    echo "\n5. Testando processamento de alertas...\n";
    
    require_once __DIR__ . '/sensores/processar_alertas.php';
    
    $leitura_teste = [
        'temperatura' => 35.0,  // Deve gerar alerta
        'ph' => 6.0,           // Deve gerar alerta
        'turbidez' => 3.0,     // Não deve gerar alerta
        'condutividade' => 2.5 // Deve gerar alerta
    ];
    
    $resultado_processamento = processarAlertasParaLeitura($conexao, 1, $leitura_teste);
    
    if ($resultado_processamento['status'] === 'sucesso') {
        echo "✅ Processamento executado com sucesso\n";
        echo "📊 Alertas gerados: {$resultado_processamento['alertas_criados']}\n";
    } else {
        echo "❌ Erro no processamento: {$resultado_processamento['mensagem']}\n";
    }
    
    // 6. Verificar alertas finais
    echo "\n6. Verificando alertas finais...\n";
    
    $sql_final = "SELECT COUNT(*) as total FROM alertas WHERE usuario_id = 1";
    $resultado_final = $conexao->query($sql_final);
    $total_final = $resultado_final->fetch_assoc()['total'];
    echo "📈 Total final de alertas: $total_final\n";
    
    // 7. Listar alertas recentes
    echo "\n7. Alertas recentes:\n";
    
    $sql_recentes = "SELECT id, titulo, nivel, valor_atual, valor_limite, data_criacao 
                     FROM alertas 
                     WHERE usuario_id = 1 
                     ORDER BY data_criacao DESC 
                     LIMIT 3";
    
    $resultado_recentes = $conexao->query($sql_recentes);
    
    while ($alerta = $resultado_recentes->fetch_assoc()) {
        $nivel_emoji = [
            'info' => 'ℹ️',
            'warning' => '⚠️',
            'critical' => '🚨'
        ];
        
        $emoji = $nivel_emoji[$alerta['nivel']] ?? '📢';
        echo "{$emoji} [{$alerta['id']}] {$alerta['titulo']} - {$alerta['valor_atual']} (limite: {$alerta['valor_limite']})\n";
    }
    
    echo "\n🎉 Teste concluído com sucesso!\n";
    echo "📱 Agora você pode testar no aplicativo mobile\n";
    
} catch (Exception $e) {
    echo "❌ Erro durante o teste: " . $e->getMessage() . "\n";
} finally {
    if (isset($conexao)) {
        $conexao->close();
    }
}
?>

