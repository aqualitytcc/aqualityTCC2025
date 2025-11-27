<?php
/**
 * Arquivo de configuração do banco de dados - PRODUÇÃO
 * Water Sense Mobile - Sistema de Monitoramento de Qualidade da Água
 * Configurado para hospedagem remota
 */

// Configurações do banco de dados de PRODUÇÃO
define('DB_SERVIDOR', 'aquality_db.mysql.dbaas.com.br');
define('DB_USUARIO', 'aquality_db');
define('DB_SENHA', 'ROSA123456a#');
define('DB_BANCO', 'aquality_db');

// Configurações de timezone para Brasil
date_default_timezone_set('America/Sao_Paulo');

// Configurações gerais da API
define('API_VERSION', '1.0');
define('API_BASE_URL', 'http://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/');

// Configurações de segurança
define('JWT_SECRET_KEY', 'water_sense_tcc_grupo5_2025_secret_key');
define('API_RATE_LIMIT', 1000); // requests por hora por IP

// Configurações de log
define('LOG_ERRORS', true);
define('LOG_FILE', __DIR__ . '/logs/api.log');

/**
 * Função para criar conexão com o banco de dados remoto
 * Inclui configurações específicas para o ambiente de produção
 */
function conectar_banco() {
    static $conexao = null;
    
    if ($conexao === null) {
        try {
            // Configurações específicas para MySQL remoto
            $conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
            
            // Definir charset para UTF-8 (importante para acentos)
            $conexao->set_charset('utf8mb4');
            
            // Configurações específicas para conexão remota
            $conexao->options(MYSQLI_OPT_CONNECT_TIMEOUT, 10);
            $conexao->options(MYSQLI_OPT_READ_TIMEOUT, 30);
            
            if ($conexao->connect_error) {
                throw new Exception('Erro de conexão: ' . $conexao->connect_error);
            }
            
            // Log de sucesso na conexão
            log_error('Conexão com banco estabelecida com sucesso', [
                'servidor' => DB_SERVIDOR,
                'banco' => DB_BANCO,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            log_error('Erro ao conectar banco: ' . $e->getMessage());
            return false;
        }
    }
    
    return $conexao;
}

/**
 * Função para log de erros
 * Cria automaticamente o diretório de logs se não existir
 */
function log_error($message, $context = []) {
    if (LOG_ERRORS) {
        $timestamp = date('Y-m-d H:i:s');
        $log_entry = "[$timestamp] $message";
        if (!empty($context)) {
            $log_entry .= " | Context: " . json_encode($context, JSON_UNESCAPED_UNICODE);
        }
        $log_entry .= PHP_EOL;
        
        // Cria diretório de logs se não existir
        $log_dir = dirname(LOG_FILE);
        if (!is_dir($log_dir)) {
            mkdir($log_dir, 0755, true);
        }
        
        // Escreve o log
        file_put_contents(LOG_FILE, $log_entry, FILE_APPEND | LOCK_EX);
    }
}

/**
 * Headers CORS padrão para permitir acesso do app mobile
 * Configurado para ambiente de produção
 */
function configurar_cors() {
    // Permite acesso de qualquer origem (para desenvolvimento)
    // Em produção, especifique o domínio do seu app
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
    
    // Responde a requisições OPTIONS (preflight CORS)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Função para verificar se as tabelas existem no banco
 * Útil para diagnóstico de problemas
 */
function verificar_estrutura_banco() {
    $conexao = conectar_banco();
    if (!$conexao) {
        return false;
    }
    
    $tabelas_necessarias = ['usuario', 'dispositivos', 'leitura'];
    $tabelas_existentes = [];
    
    $resultado = $conexao->query("SHOW TABLES");
    while ($row = $resultado->fetch_array()) {
        $tabelas_existentes[] = $row[0];
    }
    
    $status = [
        'banco_conectado' => true,
        'tabelas_existentes' => $tabelas_existentes,
        'tabelas_necessarias' => $tabelas_necessarias,
        'estrutura_ok' => true
    ];
    
    foreach ($tabelas_necessarias as $tabela) {
        if (!in_array($tabela, $tabelas_existentes)) {
            $status['estrutura_ok'] = false;
            log_error("Tabela ausente: $tabela");
        }
    }
    
    return $status;
}

/**
 * Função para resposta padronizada da API
 * Mantém consistência em todas as respostas
 */
function enviar_resposta($codigo_http, $status, $mensagem, $dados = null) {
    http_response_code($codigo_http);
    $resposta = [
        'status' => $status, 
        'mensagem' => $mensagem,
        'timestamp' => date('c'),
        'servidor' => 'Water Sense API v' . API_VERSION
    ];
    
    if ($dados) {
        $resposta['dados'] = $dados;
    }
    
    echo json_encode($resposta, JSON_UNESCAPED_UNICODE);
    
    // Log da resposta
    log_error("Resposta enviada: $status - $mensagem", [
        'codigo_http' => $codigo_http,
        'dados_inclusos' => $dados !== null
    ]);
    
    exit;
}

// Configurar error reporting para produção
error_reporting(E_ALL);
ini_set('display_errors', 0); // Não mostrar erros no output
ini_set('log_errors', 1);

// Configurar timezone do PHP
ini_set('date.timezone', 'America/Sao_Paulo');

// Definir encoding padrão
ini_set('default_charset', 'UTF-8');

?>