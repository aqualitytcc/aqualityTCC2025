<?php
// Ficheiro: servidor/web/api/ia/perguntar.php (VERSÃO 7 - Entende Meses)

require_once __DIR__ . '/../../../config.php';
require_once __DIR__ . '/../api_handler.php';
session_start();

// ... (verificações de método e sessão) ...
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}
if (!isset($_SESSION['usuario_id'])) {
    enviar_resposta(403, 'erro', 'Acesso negado.');
}

$dados = json_decode(file_get_contents("php://input"));
$pergunta = $dados->pergunta ?? '';
$dispositivo_id = $dados->dispositivo_id ?? null;

if (empty($pergunta) || empty($dispositivo_id)) {
    enviar_resposta(400, 'erro', 'Pergunta ou dispositivo em falta.');
}

// ======================= 1. PROMPT ATUALIZADO COM EXEMPLO DE MÊS =======================
$system_prompt = "Sua única tarefa é analisar a pergunta do utilizador e retornar um objeto JSON.
As intenções válidas são: GET_LAST_READING, GET_AVERAGE_PARAM, GET_MAX_PARAM, GET_MIN_PARAM, GET_DEVICE_STATUS, GET_ALL_LAST_READINGS, UNKNOWN.
Os parâmetros válidos são: ph, temperatura, turbidez, condutividade.
Os períodos válidos são: hoje, ontem, ultimas X leituras, esta semana, este mês, ou um nome de mês (ex: 'setembro').

Responda APENAS com o objeto JSON no formato {\"intent\": \"...\", \"parametro\": \"...\", \"periodo\": \"...\"}.
Não adicione NENHUM texto ou formatação extra.

Exemplos:
- Pergunta: o dispositivo está online?
- Resposta: {\"intent\": \"GET_DEVICE_STATUS\", \"parametro\": null, \"periodo\": null}
- Pergunta: qual a ultima leitura?
- Resposta: {\"intent\": \"GET_ALL_LAST_READINGS\", \"parametro\": null, \"periodo\": null}
- Pergunta: media de ph hoje
- Resposta: {\"intent\": \"GET_AVERAGE_PARAM\", \"parametro\": \"ph\", \"periodo\": \"hoje\"}
- Pergunta: temperatura máxima em setembro
- Resposta: {\"intent\": \"GET_MAX_PARAM\", \"parametro\": \"temperatura\", \"periodo\": \"setembro\"}
- Pergunta: qual a média de ph em setembro?
- Resposta: {\"intent\": \"GET_AVERAGE_PARAM\", \"parametro\": \"ph\", \"periodo\": \"setembro\"}
---
Analise a pergunta final abaixo e retorne APENAS o JSON.
[PERGUNTA]" . $pergunta . "[/PERGUNTA]";
// =====================================================================================

// ... (código do payload e da chamada cURL continua exatamente igual) ...
$payload = ['contents' => [['parts' => [['text' => $system_prompt]]]]];
$ch = curl_init();
$url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=' . GEMINI_API_KEY;
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: ' . 'application/json']);
$response_json = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code != 200) { /* ... (código de erro igual) ... */
}

$response_data = json_decode($response_json);
$texto_ia_bruto = $response_data->candidates[0]->content->parts[0]->text ?? '';
$texto_ia_json = '{}';
if (preg_match('/{.*}/s', $texto_ia_bruto, $matches)) {
    $texto_ia_json = $matches[0];
}
$acao_ia = json_decode($texto_ia_json, true);


if (json_last_error() !== JSON_ERROR_NONE) {
    $resposta_final = "O assistente de IA deu uma resposta inesperada. Tente novamente.";
} else {
    $intent = $acao_ia['intent'] ?? 'UNKNOWN';
    $parametro = $acao_ia['parametro'] ?? null;
    $periodo = strtolower($acao_ia['periodo'] ?? '');

    $conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
    $resposta_final = "Desculpe, não entendi a sua pergunta. Tente perguntar sobre a última leitura, média, máximo ou mínimo de um parâmetro, ou se o dispositivo está online.";

    switch ($intent) {
        // ... (Os cases GET_DEVICE_STATUS, GET_ALL_LAST_READINGS, GET_LAST_READING continuam iguais)
        case 'GET_DEVICE_STATUS':
            $stmt = $conexao->prepare("SELECT MAX(data_hora) as ultima_leitura FROM leitura WHERE dispositivo_id = ?");
            $stmt->bind_param("i", $dispositivo_id);
            $stmt->execute();
            $resultado = $stmt->get_result()->fetch_assoc();
            if ($resultado && $resultado['ultima_leitura']) {
                $ultimaLeitura = new DateTime($resultado['ultima_leitura']);
                $agora = new DateTime();
                $diferenca = $agora->getTimestamp() - $ultimaLeitura->getTimestamp();
                if ($diferenca < 600) {
                    $resposta_final = "Sim, o dispositivo está online. A última comunicação foi há poucos minutos.";
                } else {
                    $resposta_final = "Não, o dispositivo parece estar offline. A última comunicação foi em " . $ultimaLeitura->format('d/m/Y \à\s H:i') . ".";
                }
            } else {
                $resposta_final = "Ainda não há dados de leitura para este dispositivo.";
            }
            break;
        case 'GET_ALL_LAST_READINGS':
            $stmt = $conexao->prepare("SELECT temperatura, ph, turbidez, condutividade, data_hora FROM leitura WHERE dispositivo_id = ? ORDER BY data_hora DESC LIMIT 1");
            $stmt->bind_param("i", $dispositivo_id);
            $stmt->execute();
            $resultado = $stmt->get_result()->fetch_assoc();
            if ($resultado) {
                $resposta_final = "Aqui estão as últimas leituras de " . (new DateTime($resultado['data_hora']))->format('H:i:s') . ": ";
                $leituras = [];
                if ($resultado['temperatura'] !== null) $leituras[] = "Temperatura: {$resultado['temperatura']}°C";
                if ($resultado['ph'] !== null) $leituras[] = "pH: {$resultado['ph']}";
                if ($resultado['turbidez'] !== null) $leituras[] = "Turbidez: {$resultado['turbidez']}%";
                if ($resultado['condutividade'] !== null) $leituras[] = "Condutividade: {$resultado['condutividade']}";
                $resposta_final .= implode(", ", $leituras) . ".";
            } else {
                $resposta_final = "Não encontrei nenhuma leitura para este dispositivo.";
            }
            break;
        case 'GET_LAST_READING':
            if ($parametro) {
                $stmt = $conexao->prepare("SELECT $parametro, data_hora FROM leitura WHERE dispositivo_id = ? AND $parametro IS NOT NULL ORDER BY data_hora DESC LIMIT 1");
                $stmt->bind_param("i", $dispositivo_id);
                $stmt->execute();
                $resultado = $stmt->get_result()->fetch_assoc();
                if ($resultado) {
                    $resposta_final = "A última leitura de $parametro foi de {$resultado[$parametro]} às " . (new DateTime($resultado['data_hora']))->format('H:i:s') . ".";
                } else {
                    $resposta_final = "Não encontrei uma leitura recente para $parametro.";
                }
            }
            break;

        case 'GET_AVERAGE_PARAM':
        case 'GET_MAX_PARAM':
        case 'GET_MIN_PARAM':
            if ($parametro) {
                $agg_func = '';
                if ($intent === 'GET_AVERAGE_PARAM') {
                    $agg_func = 'AVG';
                } elseif ($intent === 'GET_MAX_PARAM') {
                    $agg_func = 'MAX';
                } elseif ($intent === 'GET_MIN_PARAM') {
                    $agg_func = 'MIN';
                }
                $limit = null;
                $month_num = null;
                $texto_periodo = 'no geral';
                $sql = "";

                $meses = [
                    'janeiro' => 1,
                    'fevereiro' => 2,
                    'março' => 3,
                    'abril' => 4,
                    'maio' => 5,
                    'junho' => 6,
                    'julho' => 7,
                    'agosto' => 8,
                    'setembro' => 9,
                    'outubro' => 10,
                    'novembro' => 11,
                    'dezembro' => 12
                ];

                $periodo_mes_encontrado = false;
                foreach ($meses as $nome_mes => $num_mes) {
                    if (str_contains($periodo, $nome_mes)) {
                        $month_num = $num_mes;
                        $texto_periodo = "em " . ucfirst($nome_mes);
                        $periodo_mes_encontrado = true;
                        break;
                    }
                }

                if (str_contains($periodo, 'ultimas')) {
                    preg_match('/(\d+)/', $periodo, $matches);
                    if (isset($matches[1])) {
                        $limit = (int)$matches[1];
                        $texto_periodo = "das últimas $limit leituras";
                        $sql = "SELECT $agg_func(sub.param) as valor FROM (SELECT $parametro as param FROM leitura WHERE dispositivo_id = ? AND $parametro IS NOT NULL ORDER BY data_hora DESC LIMIT ?) as sub";
                    }
                } elseif ($periodo_mes_encontrado) {
                    $sql = "SELECT $agg_func($parametro) as valor FROM leitura WHERE dispositivo_id = ? AND $parametro IS NOT NULL AND MONTH(data_hora) = ? AND YEAR(data_hora) = YEAR(CURDATE())";
                } else {
                    $sql = "SELECT $agg_func($parametro) as valor FROM leitura WHERE dispositivo_id = ? AND $parametro IS NOT NULL";
                    if ($periodo === 'hoje') {
                        $sql .= " AND DATE(data_hora) = CURDATE()";
                        $texto_periodo = "de hoje";
                    } elseif ($periodo === 'ontem') {
                        $sql .= " AND DATE(data_hora) = CURDATE() - INTERVAL 1 DAY";
                        $texto_periodo = "de ontem";
                    } elseif ($periodo === 'esta semana') {
                        $sql .= " AND YEARWEEK(data_hora, 1) = YEARWEEK(CURDATE(), 1)";
                        $texto_periodo = "desta semana";
                    } elseif ($periodo === 'este mês') {
                        $sql .= " AND YEAR(data_hora) = YEAR(CURDATE()) AND MONTH(data_hora) = MONTH(CURDATE())";
                        $texto_periodo = "deste mês";
                    }
                }

                if (!empty($sql)) {
                    $stmt = $conexao->prepare($sql);
                    if ($limit) {
                        $stmt->bind_param("ii", $dispositivo_id, $limit);
                    } elseif ($month_num) {
                        $stmt->bind_param("ii", $dispositivo_id, $month_num);
                    } else {
                        $stmt->bind_param("i", $dispositivo_id);
                    }
                    $stmt->execute();
                    $resultado = $stmt->get_result()->fetch_assoc();

                    if ($resultado && $resultado['valor'] !== null) {
                        $valor_formatado = number_format($resultado['valor'], 2, ',', '.');
                        $texto_func = ($agg_func == 'AVG') ? 'média' : (($agg_func == 'MAX') ? 'máxima' : 'mínima');
                        $resposta_final = "A leitura $texto_func de $parametro $texto_periodo foi de $valor_formatado.";
                    } else {
                        $resposta_final = "Não encontrei dados de $parametro para o período solicitado.";
                    }
                }
            }
            break;
    }
    $conexao->close();
}

enviar_resposta(200, 'sucesso', 'Resposta obtida.', ['texto' => $resposta_final]);
