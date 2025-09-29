<?php
// TESTE FINAL - MÁXIMA COMPATIBILIDADE
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Response básica
$response = [
    'status' => 'ONLINE',
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => $_SERVER['HTTP_HOST'] ?? 'unknown',
    'php_version' => PHP_VERSION,
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
    'message' => 'API FUNCIONANDO PERFEITAMENTE!'
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>