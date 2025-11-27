<?php
/**
 * Script para criar alertas de exemplo rapidamente
 */

require_once __DIR__ . '/config.php';

try {
    $conexao = conectar_banco();
    if (!$conexao) {
        throw new Exception('Falha na conexão');
    }
    
    // Criar alertas de exemplo
    $sql = "INSERT INTO alertas (
        usuario_id, dispositivo_id, regra_id, tipo, nivel, titulo, mensagem, 
        valor_atual, valor_limite, lido, resolvido, data_criacao
    ) VALUES 
    (1, 1, 1, 'qualidade_agua', 'warning', 'Temperatura Elevado', 
     'Valor de temperatura acima do limite: 32.5°C (limite: 30.0°C) no dispositivo Aquality01.', 
     32.5, 30.0, 0, 0, NOW()),
    (1, 1, 2, 'qualidade_agua', 'critical', 'pH Baixo', 
     'Valor de pH abaixo do limite: 6.2 (limite: 6.5) no dispositivo Aquality01.', 
     6.2, 6.5, 0, 0, NOW()),
    (1, 1, 3, 'qualidade_agua', 'info', 'Turbidez Elevado', 
     'Valor de turbidez acima do limite: 6.8 NTU (limite: 5.0 NTU) no dispositivo Aquality01.', 
     6.8, 5.0, 1, 0, NOW())";
    
    if ($conexao->query($sql)) {
        echo "✅ Alertas de exemplo criados com sucesso!\n";
    } else {
        echo "⚠️ Alguns alertas já existem\n";
    }
    
    // Verificar total
    $sql_count = "SELECT COUNT(*) as total FROM alertas WHERE usuario_id = 1";
    $resultado = $conexao->query($sql_count);
    $total = $resultado->fetch_assoc()['total'];
    echo "📊 Total de alertas: $total\n";
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}

$conexao->close();
?>

