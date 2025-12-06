<?php
// Arquivo: config.php
// Contém as informações de conexão com o banco de dados.

// Impede o acesso direto a este arquivo via navegador
if (basename(__FILE__) == basename($_SERVER['SCRIPT_FILENAME'])) {
    die('Acesso negado.');
}

// Configurações do Banco de Dados
define('DB_SERVIDOR', '');
define('DB_USUARIO', '');
define('DB_SENHA', '');
define('DB_BANCO', '');

// Configura o PHP para não exibir erros detalhados em produção (melhor para segurança)
// Em fase de desenvolvimento, você pode comentar a linha abaixo para ver os erros.
//ini_set('display_errors', 0);
//error_reporting(0);

