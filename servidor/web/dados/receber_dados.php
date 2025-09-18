<?php
// Arquivo: receber_dados.php
// Versão final com autenticação de dispositivo e lógica de INSERT/UPDATE.

// Use o caminho correto para o seu config.php. '/../' sobe um nível.
// Se ele está dois níveis acima da pasta 'dados', '/../../' está correto.
require_once __DIR__ . '/../../config.php';

// A função 'enviar_resposta' permanece a mesma.
function enviar_resposta($httpCode, $status, $mensagem, $dados_erro = null) { /* ... */ }

// 1. VERIFICA O MÉTODO DA REQUISIÇÃO
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    enviar_resposta(405, 'erro', 'Método não permitido. Utilize POST.');
}

// 2. CONECTA AO BANCO DE DADOS
$conexao = new mysqli(DB_SERVIDOR, DB_USUARIO, DB_SENHA, DB_BANCO);
if ($conexao->connect_error) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.', $conexao->connect_error);
}

// 3. AUTENTICA O DISPOSITIVO PELO CÓDIGO DE VERIFICAÇÃO
$codigo_verificacao = filter_input(INPUT_POST, 'codigo_verificacao', FILTER_SANITIZE_STRING);
if (empty($codigo_verificacao)) {
    enviar_resposta(400, 'erro', 'O campo codigo_verificacao é obrigatório.');
}

$sql_auth = "SELECT id FROM dispositivos WHERE codigo_verificacao = ? LIMIT 1";
$stmt_auth = $conexao->prepare($sql_auth);
$stmt_auth->bind_param("s", $codigo_verificacao);
$stmt_auth->execute();
$resultado_auth = $stmt_auth->get_result();

if ($resultado_auth->num_rows === 0) {
    enviar_resposta(403, 'erro', 'Dispositivo não autorizado. Código de verificação inválido.');
}
$dispositivo = $resultado_auth->fetch_assoc();
$dispositivo_id = $dispositivo['id'];
$stmt_auth->close();

// 4. RECEBE OS DADOS DOS SENSORES
$temperatura = filter_input(INPUT_POST, 'temperatura', FILTER_VALIDATE_FLOAT, FILTER_NULL_ON_FAILURE);
$ph = filter_input(INPUT_POST, 'ph', FILTER_VALIDATE_FLOAT, FILTER_NULL_ON_FAILURE);
$turbidez = filter_input(INPUT_POST, 'turbidez', FILTER_VALIDATE_FLOAT, FILTER_NULL_ON_FAILURE);
$condutividade = filter_input(INPUT_POST, 'condutividade', FILTER_VALIDATE_FLOAT, FILTER_NULL_ON_FAILURE);

// =======================================================================
// 5. LÓGICA DE ATUALIZAR OU INSERIR (AGORA USANDO dispositivo_id)
// =======================================================================

// Inicia uma transação para evitar "race conditions"
$conexao->begin_transaction();

try {
    $janelaDeTempoSegundos = 60;

    // Procura por um registro recente e incompleto para ESTE dispositivo
    $sql_select = "SELECT id FROM leitura 
                   WHERE dispositivo_id = ? 
                   AND data_hora >= NOW() - INTERVAL ? SECOND
                   AND (temperatura IS NULL OR ph IS NULL OR turbidez IS NULL OR condutividade IS NULL)
                   ORDER BY data_hora DESC LIMIT 1";

    $stmt_select = $conexao->prepare($sql_select);
    $stmt_select->bind_param("ii", $dispositivo_id, $janelaDeTempoSegundos);
    $stmt_select->execute();
    $resultado = $stmt_select->get_result();

    if ($resultado->num_rows > 0) {
        // --- UPDATE ---
        $linha = $resultado->fetch_assoc();
        $id_para_atualizar = $linha['id'];

        $update_fields = [];
        $params = [];
        $types = '';

        if ($temperatura !== null) { $update_fields[] = "temperatura = ?"; $params[] = $temperatura; $types .= 'd'; }
        if ($ph !== null) { $update_fields[] = "ph = ?"; $params[] = $ph; $types .= 'd'; }
        if ($turbidez !== null) { $update_fields[] = "turbidez = ?"; $params[] = $turbidez; $types .= 'd'; }
        if ($condutividade !== null) { $update_fields[] = "condutividade = ?"; $params[] = $condutividade; $types .= 'd'; }
        
        if (!empty($update_fields)) {
            $sql_update = "UPDATE leitura SET " . implode(', ', $update_fields) . " WHERE id = ?";
            $params[] = $id_para_atualizar;
            $types .= 'i';

            $stmt_update = $conexao->prepare($sql_update);
            $stmt_update->bind_param($types, ...$params);
            if (!$stmt_update->execute()) {
                throw new Exception($stmt_update->error);
            }
            $stmt_update->close();
            $mensagem_sucesso = 'Leitura atualizada com sucesso.';
            $http_code_sucesso = 200;
        } else {
            $mensagem_sucesso = 'Nenhum dado novo para atualizar.';
            $http_code_sucesso = 200;
        }

    } else {
        // --- INSERT ---
        $sql_insert = "INSERT INTO leitura (dispositivo_id, temperatura, ph, turbidez, condutividade) VALUES (?, ?, ?, ?, ?)";
        $stmt_insert = $conexao->prepare($sql_insert);
        $stmt_insert->bind_param("idddd", $dispositivo_id, $temperatura, $ph, $turbidez, $condutividade);
        if (!$stmt_insert->execute()) {
            throw new Exception($stmt_insert->error);
        }
        $stmt_insert->close();
        $mensagem_sucesso = 'Nova leitura criada com sucesso.';
        $http_code_sucesso = 201;
    }
    
    $stmt_select->close();

    // Se tudo deu certo, confirma as alterações no banco
    $conexao->commit();
    enviar_resposta($http_code_sucesso, 'sucesso', $mensagem_sucesso);

} catch (Exception $e) {
    // Se algo deu errado, desfaz todas as alterações
    $conexao->rollback();
    enviar_resposta(500, 'erro', 'Ocorreu um erro na transação com o banco de dados.', $e->getMessage());
}

$conexao->close();