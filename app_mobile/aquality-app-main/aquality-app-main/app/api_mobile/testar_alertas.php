<?php
/**
 * Script para testar o sistema de alertas
 * Cria dados de exemplo e simula alertas
 */

require_once __DIR__ . '/../config.php';

// Conecta ao banco de dados
$conexao = conectar_banco();
if (!$conexao) {
    die('Falha na conexão com o banco de dados.');
}

echo "🔧 Testando Sistema de Alertas\n";
echo "==============================\n\n";

try {
    // 1. Criar regras de alerta de exemplo
    echo "1. Criando regras de alerta de exemplo...\n";
    
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
    
    // 2. Criar alertas de exemplo
    echo "\n2. Criando alertas de exemplo...\n";
    
    $alertas_exemplo = [
        [
            'usuario_id' => 1,
            'dispositivo_id' => 1,
            'regra_id' => 1,
            'tipo' => 'qualidade_agua',
            'nivel' => 'warning',
            'titulo' => 'Temperatura Elevado',
            'mensagem' => 'Valor de temperatura acima do limite: 32.5°C (limite: 30.0°C) no dispositivo Aquality01.',
            'valor_atual' => 32.5,
            'valor_limite' => 30.0
        ],
        [
            'usuario_id' => 1,
            'dispositivo_id' => 1,
            'regra_id' => 2,
            'tipo' => 'qualidade_agua',
            'nivel' => 'critical',
            'titulo' => 'pH Baixo',
            'mensagem' => 'Valor de pH abaixo do limite: 6.2 (limite: 6.5) no dispositivo Aquality01.',
            'valor_atual' => 6.2,
            'valor_limite' => 6.5
        ],
        [
            'usuario_id' => 1,
            'dispositivo_id' => 1,
            'regra_id' => 3,
            'tipo' => 'qualidade_agua',
            'nivel' => 'info',
            'titulo' => 'Turbidez Elevado',
            'mensagem' => 'Valor de turbidez acima do limite: 6.8 NTU (limite: 5.0 NTU) no dispositivo Aquality01.',
            'valor_atual' => 6.8,
            'valor_limite' => 5.0
        ]
    ];
    
    $alertas_criados = 0;
    foreach ($alertas_exemplo as $alerta) {
        $sql = "INSERT INTO alertas (
            usuario_id, dispositivo_id, regra_id, tipo, nivel, titulo, mensagem, 
            valor_atual, valor_limite, lido, resolvido, data_criacao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW())";
        
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param(
            "iiissssdd",
            $alerta['usuario_id'],
            $alerta['dispositivo_id'],
            $alerta['regra_id'],
            $alerta['tipo'],
            $alerta['nivel'],
            $alerta['titulo'],
            $alerta['mensagem'],
            $alerta['valor_atual'],
            $alerta['valor_limite']
        );
        
        if ($stmt->execute()) {
            $alertas_criados++;
        }
    }
    
    echo "✅ {$alertas_criados} alertas de exemplo criados\n";
    
    // 3. Testar processamento de alertas
    echo "\n3. Testando processamento de alertas...\n";
    
    require_once __DIR__ . '/processar_alertas.php';
    
    $leitura_teste = [
        'temperatura' => 35.0,  // Deve gerar alerta (limite: 30.0)
        'ph' => 6.0,           // Deve gerar alerta (limite: 6.5)
        'turbidez' => 3.0,     // Não deve gerar alerta (limite: 5.0)
        'condutividade' => 2.5 // Deve gerar alerta (limite: 2.0)
    ];
    
    $resultado = processarAlertasParaLeitura($conexao, 1, $leitura_teste);
    
    if ($resultado['status'] === 'sucesso') {
        echo "✅ Processamento executado com sucesso\n";
        echo "📊 Alertas gerados: {$resultado['alertas_criados']}\n";
        if (!empty($resultado['ids_alertas'])) {
            echo "🆔 IDs dos alertas: " . implode(', ', $resultado['ids_alertas']) . "\n";
        }
    } else {
        echo "❌ Erro no processamento: {$resultado['mensagem']}\n";
    }
    
    // 4. Verificar alertas no banco
    echo "\n4. Verificando alertas no banco...\n";
    
    $sql_verificar = "SELECT COUNT(*) as total FROM alertas WHERE usuario_id = 1";
    $resultado_verificar = $conexao->query($sql_verificar);
    $total_alertas = $resultado_verificar->fetch_assoc()['total'];
    
    echo "📈 Total de alertas para usuário 1: {$total_alertas}\n";
    
    // 5. Listar alertas recentes
    echo "\n5. Alertas recentes:\n";
    
    $sql_recentes = "SELECT id, titulo, nivel, valor_atual, valor_limite, data_criacao 
                     FROM alertas 
                     WHERE usuario_id = 1 
                     ORDER BY data_criacao DESC 
                     LIMIT 5";
    
    $resultado_recentes = $conexao->query($sql_recentes);
    
    while ($alerta = $resultado_recentes->fetch_assoc()) {
        $nivel_emoji = [
            'info' => 'ℹ️',
            'warning' => '⚠️',
            'critical' => '🚨'
        ];
        
        $emoji = $nivel_emoji[$alerta['nivel']] ?? '📢';
        echo "{$emoji} [{$alerta['id']}] {$alerta['titulo']} - {$alerta['valor_atual']} (limite: {$alerta['valor_limite']}) - {$alerta['data_criacao']}\n";
    }
    
    echo "\n🎉 Teste do sistema de alertas concluído!\n";
    echo "📱 Agora você pode testar no aplicativo mobile na aba 'Alertas'\n";
    
} catch (Exception $e) {
    echo "❌ Erro durante o teste: " . $e->getMessage() . "\n";
}

$conexao->close();
?>
