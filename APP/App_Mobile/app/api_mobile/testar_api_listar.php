<?php
/**
 * Script para testar a API listar.php diretamente
 */

require_once __DIR__ . '/config.php';

try {
    $conexao = conectar_banco();
    if (!$conexao) {
        throw new Exception('Falha na conexão');
    }
    
    $usuario_id = 1;
    
    echo "=== TESTE API LISTAR ===\n\n";
    
    // Simula a lógica da API listar.php
    $sql = "SELECT 
                d.id,
                d.nome_dispositivo,
                d.codigo_verificacao,
                d.localizacao,
                d.data_criacao
            FROM dispositivos d
            WHERE d.usuario_id = ?";
    
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $resultado = $stmt->get_result();
    
    $dispositivos = [];
    while ($dispositivo = $resultado->fetch_assoc()) {
        $total_leituras = 0;
        $ultima_leitura = null;
        
        // Verifica se a tabela leitura existe
        $sql_check_leituras = "SHOW TABLES LIKE 'leitura'";
        $resultado_check = $conexao->query($sql_check_leituras);
        
        if ($resultado_check && $resultado_check->num_rows > 0) {
            // Conta total de leituras
            $sql_leituras = "SELECT COUNT(*) as total FROM leitura 
                             WHERE dispositivo_id = ?";
            $stmt_leituras = $conexao->prepare($sql_leituras);
            $stmt_leituras->bind_param("i", $dispositivo['id']);
            $stmt_leituras->execute();
            $total_leituras = $stmt_leituras->get_result()->fetch_assoc()['total'];
            
            // Busca última leitura
            $sql_ultima = "SELECT data_hora, temperatura, ph, turbidez, condutividade 
                           FROM leitura 
                           WHERE dispositivo_id = ? 
                           ORDER BY data_hora DESC 
                           LIMIT 1";
            $stmt_ultima = $conexao->prepare($sql_ultima);
            $stmt_ultima->bind_param("i", $dispositivo['id']);
            $stmt_ultima->execute();
            $resultado_ultima = $stmt_ultima->get_result();
            
            if ($resultado_ultima->num_rows > 0) {
                $ultima_leitura = $resultado_ultima->fetch_assoc();
            }
        }
        
        // Determina status ONLINE/OFFLINE baseado nas últimas 10 minutos
        $status = 'offline';
        $tempo_offline = 'Nunca';
        
        if ($ultima_leitura) {
            $ultima_leitura_time = new DateTime($ultima_leitura['data_hora']);
            $agora = new DateTime();
            
            // Calcula diferença em minutos corretamente
            $diferenca_segundos = $agora->getTimestamp() - $ultima_leitura_time->getTimestamp();
            $diferenca_minutos = floor($diferenca_segundos / 60);
            
            echo "Dispositivo: {$dispositivo['nome_dispositivo']}\n";
            echo "Última leitura: {$ultima_leitura['data_hora']}\n";
            echo "Diferença: {$diferenca_minutos} minutos\n";
            echo "PH: {$ultima_leitura['ph']}\n";
            echo "Turbidez: {$ultima_leitura['turbidez']}\n";
            echo "Condutividade: {$ultima_leitura['condutividade']}\n";
            echo "Temperatura: {$ultima_leitura['temperatura']}\n";
            
            if ($diferenca_minutos <= 10) {
                $status = 'online';
                $tempo_offline = 'Online';
            } else {
                $status = 'offline';
                if ($diferenca_minutos < 60) {
                    $tempo_offline = $diferenca_minutos . ' min atrás';
                } else if ($diferenca_minutos < 1440) { // menos de 24h
                    $horas = floor($diferenca_minutos / 60);
                    $tempo_offline = $horas . 'h atrás';
                } else {
                    $dias = floor($diferenca_minutos / 1440);
                    $tempo_offline = $dias . ' dias atrás';
                }
            }
            
            echo "Status calculado: {$status}\n";
            echo "Tempo offline: {$tempo_offline}\n";
        }
        
        echo "---\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}

$conexao->close();
?>
