<?php
// Ficheiro: servidor/web/api/api_handler.php

// Impede o acesso direto a este arquivo via navegador
if (basename(__FILE__) == basename($_SERVER['SCRIPT_FILENAME'])) {
    die('Acesso negado.');
}

/**
 * Envia uma resposta JSON padronizada e termina a execução do script.
 *
 * @param int    $codigo_http O código de status HTTP (ex: 200, 404, 500).
 * @param string $status      O status da resposta ('sucesso' ou 'erro').
 * @param string $mensagem    Uma mensagem clara para o frontend.
 * @param mixed  $dados       Os dados a serem enviados (opcional).
 */
function enviar_resposta($codigo_http, $status, $mensagem, $dados = null) {
    // Define o cabeçalho para garantir que a resposta seja sempre JSON
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code($codigo_http);

    $resposta = [
        'status' => $status,
        'mensagem' => $mensagem
    ];

    // Adiciona a chave 'dados' apenas se eles forem fornecidos
    if ($dados !== null) {
        $resposta['dados'] = $dados;
    }

    echo json_encode($resposta);
    exit;
}
?>