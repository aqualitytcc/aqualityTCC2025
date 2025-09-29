<?php
// Ficheiro: web/api/alertas/verificar.php (VERSÃO CORRIGIDA)
require_once __DIR__ . '/../../../config.php';
session_start();

header("Content-Type: application/json; charset=UTF-8");

function enviar_resposta($codigo, $status, $mensagem, $dados = null) {
    http_response_code($codigo);
    $resposta = ['status' => $status, 'mensagem' => $mensagem];
    if ($dados !== null) {
        $resposta['dados'] = $dados;
    }
    echo json_encode($resposta);
    exit;
}

if (!isset($_SESSION['usuario_id'])) {
    enviar_resposta(403, 'erro', 'Acesso negado.');
}
$usuario_id = $_SESSION['usuario_id'];

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o servidor.');
}

// 1. Buscar TODOS os dispositivos do utilizador e o seu modo de alerta
$sql_dispositivos = "SELECT id, nome_dispositivo, modo_alerta FROM dispositivos WHERE usuario_id = ?";
$stmt_dispositivos = $conexao->prepare($sql_dispositivos);
$stmt_dispositivos->bind_param("i", $usuario_id);
$stmt_dispositivos->execute();
$resultado_dispositivos = $stmt_dispositivos->get_result();
$dispositivos = [];
while ($linha = $resultado_dispositivos->fetch_assoc()) {
    $dispositivos[$linha['id']] = $linha;
}
$stmt_dispositivos->close();

if (empty($dispositivos)) {
    enviar_resposta(200, 'sucesso', 'Nenhum dispositivo encontrado.', ['notificacoes' => [], 'leituras' => []]);
}

// 2. Buscar a LEITURA MAIS RECENTE de cada dispositivo
$dispositivos_ids = array_keys($dispositivos);
$placeholders = implode(',', array_fill(0, count($dispositivos_ids), '?'));
$types = str_repeat('i', count($dispositivos_ids));

$sql_leituras = "SELECT l1.* FROM leitura l1
                 INNER JOIN (
                     SELECT dispositivo_id, MAX(data_hora) AS max_data_hora
                     FROM leitura
                     WHERE dispositivo_id IN ($placeholders)
                     GROUP BY dispositivo_id
                 ) l2 ON l1.dispositivo_id = l2.dispositivo_id AND l1.data_hora = l2.max_data_hora";

$stmt_leituras = $conexao->prepare($sql_leituras);
$stmt_leituras->bind_param($types, ...$dispositivos_ids);
$stmt_leituras->execute();
$resultado_leituras = $stmt_leituras->get_result();
$leituras_recentes = [];
while ($linha = $resultado_leituras->fetch_assoc()) {
    $leituras_recentes[$linha['dispositivo_id']] = $linha;
}
$stmt_leituras->close();

// 3. Buscar TODAS as regras PERSONALIZADAS do utilizador e organizá-las por dispositivo
$sql_regras = "SELECT dispositivo_id, parametro, condicao, valor FROM regras_alerta WHERE usuario_id = ?";
$stmt_regras = $conexao->prepare($sql_regras);
$stmt_regras->bind_param("i", $usuario_id);
$stmt_regras->execute();
$resultado_regras = $stmt_regras->get_result();
$regras_personalizadas = [];
while ($linha = $resultado_regras->fetch_assoc()) {
    $regras_personalizadas[$linha['dispositivo_id']][] = $linha;
}
$stmt_regras->close();

// 4. NOVO "MOTOR" DE VERIFICAÇÃO (MODE-AWARE)
$notificacoes = [];

foreach ($dispositivos as $dispositivo_id => $dispositivo) {
    if (!isset($leituras_recentes[$dispositivo_id])) {
        continue; // Pula para o próximo dispositivo se não houver leitura recente
    }
    
    $leitura = $leituras_recentes[$dispositivo_id];
    $nome_dispositivo = $dispositivo['nome_dispositivo'];

    // --- VERIFICAÇÃO PARA MODO 'PADRÃO' ---
    if ($dispositivo['modo_alerta'] === 'padrão') {
        // Regra pH
        if (isset($leitura['ph']) && ($leitura['ph'] < 6.0 || $leitura['ph'] > 9.5)) {
            $notificacoes[] = "Alerta Padrão em '$nome_dispositivo': pH (".$leitura['ph'].") fora do limite (6.0 - 9.5).";
        }
        // Regra Turbidez
        if (isset($leitura['turbidez']) && $leitura['turbidez'] > 15.0) {
            $notificacoes[] = "Alerta Padrão em '$nome_dispositivo': Turbidez (".$leitura['turbidez']."%) acima do limite (15.0 %).";
        }
        // Regra Condutividade
        if (isset($leitura['condutividade']) && $leitura['condutividade'] > 250.0) {
            $notificacoes[] = "Alerta Padrão em '$nome_dispositivo': Condutividade (".$leitura['condutividade'].") acima do limite (250).";
        }
    }
    // --- VERIFICAÇÃO PARA MODO 'PERSONALIZADO' ---
    elseif ($dispositivo['modo_alerta'] === 'personalizado') {
        if (isset($regras_personalizadas[$dispositivo_id])) {
            foreach ($regras_personalizadas[$dispositivo_id] as $regra) {
                $parametro = $regra['parametro'];
                $valor_leitura = $leitura[$parametro] ?? null;

                if ($valor_leitura !== null) {
                    $violada = false;
                    if ($regra['condicao'] === 'maior_que' && $valor_leitura > $regra['valor']) $violada = true;
                    if ($regra['condicao'] === 'menor_que' && $valor_leitura < $regra['valor']) $violada = true;

                    if ($violada) {
                        $notificacoes[] = sprintf(
                            "Alerta em '%s': %s (%.2f) está fora do limite de %s %.2f.",
                            $nome_dispositivo, ucfirst($parametro), $valor_leitura, str_replace('_', ' ', $regra['condicao']), $regra['valor']
                        );
                    }
                }
            }
        }
    }
}

$conexao->close();

enviar_resposta(200, 'sucesso', 'Verificação concluída.', [
    'notificacoes' => $notificacoes,
    'leituras' => $leituras_recentes
]);
?>