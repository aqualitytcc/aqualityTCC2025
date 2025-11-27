<?php
/**
 * API de Gerenciamento de Dispositivos - Water Sense Mobile
 * Endpoints para CRUD de dispositivos ESP32
 * Adaptado para a estrutura do banco existente
 */

require_once __DIR__ . '/../config.php';

// Configura CORS e headers
configurar_cors();

// Conecta ao banco de dados
$conexao = conectar_banco();
if (!$conexao) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.');
}

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        listar_dispositivos($conexao);
        break;
    case 'POST':
        cadastrar_dispositivo($conexao);
        break;
    case 'PUT':
        atualizar_dispositivo($conexao);
        break;
    case 'DELETE':
        remover_dispositivo($conexao);
        break;
    default:
        enviar_resposta(405, 'erro', 'Método não permitido.');
}

/**
 * Lista dispositivos do usuário
 */
function listar_dispositivos($conexao) {
    $usuario_id = $_GET['usuario_id'] ?? null;
    
    if (!$usuario_id) {
        enviar_resposta(400, 'erro', 'ID do usuário é obrigatório.');
    }
    
    try {
        // Busca dispositivos do usuário na estrutura existente
        $sql = "SELECT 
                    d.id,
                    d.usuario_id,
                    d.codigo_verificacao as codigo_dispositivo,
                    d.localizacao,
                    d.data_criacao,
                    COUNT(l.id) as total_leituras,
                    MAX(l.data_hora) as ultima_leitura
                FROM dispositivos d
                LEFT JOIN leitura l ON d.id = l.dispositivo_id
                WHERE d.usuario_id = ?
                GROUP BY d.id, d.usuario_id, d.codigo_verificacao, d.localizacao, d.data_criacao
                ORDER BY d.data_criacao DESC";
        
        $stmt = $conexao->prepare($sql);
        if (!$stmt) {
            throw new Exception('Erro ao preparar consulta: ' . $conexao->error);
        }
        
        $stmt->bind_param("i", $usuario_id);
        $stmt->execute();
        $resultado = $stmt->get_result();
        
        $dispositivos = [];
        while ($row = $resultado->fetch_assoc()) {
            // Calcula status baseado na última leitura
            $status = 'offline';
            $tempo_offline = 'Nunca conectado';
            
            if ($row['ultima_leitura']) {
                $ultima_leitura = new DateTime($row['ultima_leitura']);
                $agora = new DateTime();
                $diferenca = $agora->diff($ultima_leitura);
                
                // Considera online se teve leitura nos últimos 10 minutos
                if ($diferenca->i < 10 && $diferenca->h == 0 && $diferenca->days == 0) {
                    $status = 'online';
                    $tempo_offline = 'Online';
                } elseif ($diferenca->days > 0) {
                    $tempo_offline = $diferenca->days . " dias atrás";
                } elseif ($diferenca->h > 0) {
                    $tempo_offline = $diferenca->h . " horas atrás";
                } else {
                    $tempo_offline = $diferenca->i . " minutos atrás";
                }
            }
            
            $dispositivos[] = [
                'id' => intval($row['id']),
                'nome' => $row['codigo_verificacao'] ?: 'Dispositivo ' . $row['id'],
                'codigo_dispositivo' => $row['codigo_verificacao'],
                'localizacao' => $row['localizacao'] ?: 'Não informado',
                'status' => $status,
                'nivel_bateria' => 85, // Valor padrão - pode ser atualizado quando houver leituras
                'estatisticas' => [
                    'total_leituras' => intval($row['total_leituras']),
                    'ultima_leitura' => $row['ultima_leitura'],
                    'tempo_offline' => $tempo_offline
                ],
                'datas' => [
                    'criacao' => $row['data_criacao']
                ]
            ];
        }
        
        log_error('Dispositivos listados com sucesso', [
            'usuario_id' => $usuario_id,
            'total_dispositivos' => count($dispositivos)
        ]);
        
        enviar_resposta(200, 'sucesso', 'Dispositivos obtidos com sucesso', $dispositivos);
        
    } catch (Exception $e) {
        log_error('Erro ao listar dispositivos', [
            'erro' => $e->getMessage(),
            'usuario_id' => $usuario_id
        ]);
        
        enviar_resposta(500, 'erro', 'Erro interno do servidor.');
    }
}

/**
 * Cadastra um novo dispositivo
 */
function cadastrar_dispositivo($conexao) {
    $dados = json_decode(file_get_contents("php://input"), true);
    
    // Validação dos campos obrigatórios
    $campos_obrigatorios = ['usuario_id', 'codigo_verificacao', 'localizacao'];
    foreach ($campos_obrigatorios as $campo) {
        if (!isset($dados[$campo]) || empty($dados[$campo])) {
            enviar_resposta(400, 'erro', "Campo obrigatório ausente: $campo");
        }
    }
    
    $usuario_id = intval($dados['usuario_id']);
    $codigo_verificacao = trim($dados['codigo_verificacao']);
    $localizacao = trim($dados['localizacao']);
    
    try {
        // Verifica se o usuário existe
        $sql_user = "SELECT id FROM usuario WHERE id = ?";
        $stmt_user = $conexao->prepare($sql_user);
        $stmt_user->bind_param("i", $usuario_id);
        $stmt_user->execute();
        
        if ($stmt_user->get_result()->num_rows === 0) {
            enviar_resposta(404, 'erro', 'Usuário não encontrado.');
        }
        
        // Verifica se o código de verificação já existe
        $sql_check = "SELECT id FROM dispositivos WHERE codigo_verificacao = ?";
        $stmt_check = $conexao->prepare($sql_check);
        $stmt_check->bind_param("s", $codigo_verificacao);
        $stmt_check->execute();
        
        if ($stmt_check->get_result()->num_rows > 0) {
            enviar_resposta(409, 'erro', 'Código de verificação já está em uso.');
        }
        
        // Insere o novo dispositivo
        $sql_insert = "INSERT INTO dispositivos (usuario_id, codigo_verificacao, localizacao, data_criacao) VALUES (?, ?, ?, NOW())";
        $stmt_insert = $conexao->prepare($sql_insert);
        
        if (!$stmt_insert) {
            throw new Exception('Erro ao preparar inserção: ' . $conexao->error);
        }
        
        $stmt_insert->bind_param("iss", $usuario_id, $codigo_verificacao, $localizacao);
        
        if ($stmt_insert->execute()) {
            $dispositivo_id = $conexao->insert_id;
            
            log_error('Dispositivo cadastrado com sucesso', [
                'dispositivo_id' => $dispositivo_id,
                'usuario_id' => $usuario_id,
                'codigo_verificacao' => $codigo_verificacao,
                'localizacao' => $localizacao
            ]);
            
            enviar_resposta(201, 'sucesso', 'Dispositivo cadastrado com sucesso', [
                'dispositivo_id' => $dispositivo_id,
                'codigo_dispositivo' => $codigo_verificacao
            ]);
            
        } else {
            throw new Exception('Erro ao inserir dispositivo: ' . $stmt_insert->error);
        }
        
    } catch (Exception $e) {
        log_error('Erro ao cadastrar dispositivo', [
            'erro' => $e->getMessage(),
            'dados' => $dados
        ]);
        
        enviar_resposta(500, 'erro', 'Erro interno do servidor.');
    }
}

/**
 * Atualiza um dispositivo existente
 */
function atualizar_dispositivo($conexao) {
    $dados = json_decode(file_get_contents("php://input"), true);
    $dispositivo_id = $_GET['id'] ?? $dados['id'] ?? null;
    
    if (!$dispositivo_id) {
        enviar_resposta(400, 'erro', 'ID do dispositivo é obrigatório.');
    }
    
    try {
        // Verifica se o dispositivo existe
        $sql_check = "SELECT id FROM dispositivos WHERE id = ?";
        $stmt_check = $conexao->prepare($sql_check);
        $stmt_check->bind_param("i", $dispositivo_id);
        $stmt_check->execute();
        
        if ($stmt_check->get_result()->num_rows === 0) {
            enviar_resposta(404, 'erro', 'Dispositivo não encontrado.');
        }
        
        // Campos que podem ser atualizados
        $updates = [];
        $params = [];
        $types = "";
        
        if (isset($dados['localizacao']) && !empty(trim($dados['localizacao']))) {
            $updates[] = "localizacao = ?";
            $params[] = trim($dados['localizacao']);
            $types .= "s";
        }
        
        if (isset($dados['codigo_verificacao']) && !empty(trim($dados['codigo_verificacao']))) {
            $updates[] = "codigo_verificacao = ?";
            $params[] = trim($dados['codigo_verificacao']);
            $types .= "s";
        }
        
        if (empty($updates)) {
            enviar_resposta(400, 'erro', 'Nenhum campo para atualizar.');
        }
        
        $sql_update = "UPDATE dispositivos SET " . implode(', ', $updates) . " WHERE id = ?";
        $params[] = $dispositivo_id;
        $types .= "i";
        
        $stmt_update = $conexao->prepare($sql_update);
        $stmt_update->bind_param($types, ...$params);
        
        if ($stmt_update->execute()) {
            log_error('Dispositivo atualizado com sucesso', [
                'dispositivo_id' => $dispositivo_id,
                'campos_atualizados' => array_keys($dados)
            ]);
            
            enviar_resposta(200, 'sucesso', 'Dispositivo atualizado com sucesso');
        } else {
            throw new Exception('Erro ao atualizar: ' . $stmt_update->error);
        }
        
    } catch (Exception $e) {
        log_error('Erro ao atualizar dispositivo', [
            'erro' => $e->getMessage(),
            'dispositivo_id' => $dispositivo_id
        ]);
        
        enviar_resposta(500, 'erro', 'Erro interno do servidor.');
    }
}

/**
 * Remove um dispositivo
 */
function remover_dispositivo($conexao) {
    $dispositivo_id = $_GET['id'] ?? null;
    
    if (!$dispositivo_id) {
        enviar_resposta(400, 'erro', 'ID do dispositivo é obrigatório.');
    }
    
    try {
        // Verifica se o dispositivo existe
        $sql_check = "SELECT codigo_verificacao FROM dispositivos WHERE id = ?";
        $stmt_check = $conexao->prepare($sql_check);
        $stmt_check->bind_param("i", $dispositivo_id);
        $stmt_check->execute();
        $resultado = $stmt_check->get_result();
        
        if ($resultado->num_rows === 0) {
            enviar_resposta(404, 'erro', 'Dispositivo não encontrado.');
        }
        
        $dispositivo = $resultado->fetch_assoc();
        
        // Remove o dispositivo (e suas leituras por cascata)
        $sql_delete = "DELETE FROM dispositivos WHERE id = ?";
        $stmt_delete = $conexao->prepare($sql_delete);
        $stmt_delete->bind_param("i", $dispositivo_id);
        
        if ($stmt_delete->execute()) {
            log_error('Dispositivo removido com sucesso', [
                'dispositivo_id' => $dispositivo_id,
                'codigo_verificacao' => $dispositivo['codigo_verificacao']
            ]);
            
            enviar_resposta(200, 'sucesso', 'Dispositivo removido com sucesso');
        } else {
            throw new Exception('Erro ao remover: ' . $stmt_delete->error);
        }
        
    } catch (Exception $e) {
        log_error('Erro ao remover dispositivo', [
            'erro' => $e->getMessage(),
            'dispositivo_id' => $dispositivo_id
        ]);
        
        enviar_resposta(500, 'erro', 'Erro interno do servidor.');
    }
}

$conexao->close();
?>