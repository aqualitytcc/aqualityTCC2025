<?php
/**
 * Script para testar os dados retornados pelas APIs
 */

require_once __DIR__ . '/config.php';

try {
    $conexao = conectar_banco();
    if (!$conexao) {
        throw new Exception('Falha na conexão');
    }
    
    echo "=== TESTE DE DADOS ===\n\n";
    
    // Teste 1: Verificar dispositivos
    echo "1. DISPOSITIVOS:\n";
    $sql = "SELECT * FROM dispositivos WHERE usuario_id = 1";
    $resultado = $conexao->query($sql);
    while ($row = $resultado->fetch_assoc()) {
        echo "ID: {$row['id']}, Nome: {$row['nome_dispositivo']}\n";
    }
    
    // Teste 2: Verificar leituras
    echo "\n2. LEITURAS:\n";
    $sql = "SELECT * FROM leitura WHERE dispositivo_id = 1 ORDER BY data_hora DESC LIMIT 5";
    $resultado = $conexao->query($sql);
    while ($row = $resultado->fetch_assoc()) {
        echo "Data: {$row['data_hora']}, PH: {$row['ph']}, Turbidez: {$row['turbidez']}, Condutividade: {$row['condutividade']}, Temperatura: {$row['temperatura']}\n";
    }
    
    // Teste 3: Verificar última leitura
    echo "\n3. ÚLTIMA LEITURA:\n";
    $sql = "SELECT * FROM leitura WHERE dispositivo_id = 1 ORDER BY data_hora DESC LIMIT 1";
    $resultado = $conexao->query($sql);
    if ($row = $resultado->fetch_assoc()) {
        echo "Data: {$row['data_hora']}\n";
        echo "PH: {$row['ph']}\n";
        echo "Turbidez: {$row['turbidez']}\n";
        echo "Condutividade: {$row['condutividade']}\n";
        echo "Temperatura: {$row['temperatura']}\n";
        
        // Calcular tempo
        $ultima_leitura_time = new DateTime($row['data_hora']);
        $agora = new DateTime();
        $diferenca_segundos = $agora->getTimestamp() - $ultima_leitura_time->getTimestamp();
        $diferenca_minutos = floor($diferenca_segundos / 60);
        
        echo "\nTempo decorrido: {$diferenca_minutos} minutos\n";
        echo "Status: " . ($diferenca_minutos <= 10 ? 'ONLINE' : 'OFFLINE') . "\n";
    }
    
    // Teste 4: Simular API listar
    echo "\n4. SIMULAÇÃO API LISTAR:\n";
    $sql = "SELECT 
                d.id,
                d.nome_dispositivo,
                d.codigo_verificacao,
                d.localizacao,
                d.data_criacao,
                COUNT(l.id) as total_leituras,
                l.data_hora,
                l.ph,
                l.turbidez,
                l.condutividade,
                l.temperatura
            FROM dispositivos d
            LEFT JOIN leitura l ON d.id = l.dispositivo_id
            WHERE d.usuario_id = 1
            GROUP BY d.id
            ORDER BY d.data_criacao";
    
    $resultado = $conexao->query($sql);
    while ($row = $resultado->fetch_assoc()) {
        echo "Dispositivo: {$row['nome_dispositivo']}\n";
        echo "Total leituras: {$row['total_leituras']}\n";
        echo "Última leitura: {$row['data_hora']}\n";
        echo "PH: {$row['ph']}\n";
        echo "Turbidez: {$row['turbidez']}\n";
        echo "Condutividade: {$row['condutividade']}\n";
        echo "Temperatura: {$row['temperatura']}\n";
        echo "---\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}

$conexao->close();
?>
