<?php
// Ficheiro: servidor/web/api/alertas/historico.php (VERSÃO FINAL CORRIGIDA)

// Força a exibição de todos os erros do PHP
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../../../config.php';
session_start();

// Função de resposta local para garantir que o script é autossuficiente
function enviar_resposta($codigo_http, $status, $mensagem, $dados = null) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code($codigo_http);
    $resposta = ['status' => $status, 'mensagem' => $mensagem];
    if ($dados !== null) {
        $resposta['dados'] = $dados;
    }
    // Usamos json_encode com uma flag para tentar evitar erros de codificação de caracteres
    echo json_encode($resposta, JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_SESSION['usuario_id'])) {
    enviar_resposta(403, 'erro', 'Acesso negado. Por favor, faça login primeiro.');
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    enviar_resposta(405, 'erro', 'Método não permitido.');
}

$usuario_id = $_SESSION['usuario_id'];

$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    // A função die() irá mostrar o erro de conexão exato na aba "Rede"
    die("Erro de Conexão com a Base de Dados: " . $conexao->connect_error);
}
// Garante que a conexão usa o charset correto para evitar problemas com acentos
$conexao->set_charset('utf8mb4');

$sql = "SELECT 
            a.id,
            a.titulo,
            a.mensagem,
            a.nivel,
            a.data_criacao,
            a.resolvido,
            COALESCE(d.nome_dispositivo, 'Dispositivo Desconhecido') as nome_dispositivo
        FROM alertas a
        LEFT JOIN dispositivos d ON a.dispositivo_id = d.id
        WHERE a.usuario_id = ?
        ORDER BY a.data_criacao DESC";

$stmt = $conexao->prepare($sql);
if (!$stmt) {
    die("Erro ao preparar a query: " . $conexao->error);
}

$stmt->bind_param("i", $usuario_id);

// ===== ALTERAÇÃO CRUCIAL AQUI =====
// Verificamos se a execução da query falhou e, se sim, mostramos o erro exato.
if (!$stmt->execute()) {
    die("Erro ao executar a query: " . $stmt->error);
}
// ==================================

$resultado = $stmt->get_result();
if (!$resultado) {
    die("Erro ao obter os resultados: " . $conexao->error);
}

$historico = [];
while ($linha = $resultado->fetch_assoc()) {
    $historico[] = $linha;
}

$stmt->close();
$conexao->close();

enviar_resposta(200, 'sucesso', 'Histórico de alertas obtido com sucesso.', $historico);

?>