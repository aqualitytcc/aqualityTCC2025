<?php
/**
 * API Simplificada para Alertas - Versão Funcional
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

try {
    $conexao = conectar_banco();
    if (!$conexao) {
        throw new Exception('Falha na conexão com o banco de dados');
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'GET':
            $usuario_id = $_GET['usuario_id'] ?? null;
            $limit = (int)($_GET['limit'] ?? 20);
            $offset = (int)($_GET['offset'] ?? 0);
            
            if (!$usuario_id) {
                throw new Exception('ID do usuário é obrigatório');
            }
            
            // Buscar alertas
            $sql = "SELECT 
                        a.id,
                        a.tipo,
                        a.nivel,
                        a.titulo,
                        a.mensagem,
                        a.valor_atual,
                        a.valor_limite,
                        a.lido,
                        a.resolvido,
                        a.data_criacao,
                        a.data_resolucao,
                        COALESCE(d.nome_dispositivo, 'Dispositivo') as nome_dispositivo,
                        COALESCE(d.localizacao, 'Não informado') as localizacao
                    FROM alertas a
                    LEFT JOIN dispositivos d ON a.dispositivo_id = d.id
                    WHERE a.usuario_id = ?
                    ORDER BY a.data_criacao DESC
                    LIMIT ? OFFSET ?";
            
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("iii", $usuario_id, $limit, $offset);
            $stmt->execute();
            $resultado = $stmt->get_result();
            
            $alertas = [];
            while ($row = $resultado->fetch_assoc()) {
                $alertas[] = [
                    'id' => (int)$row['id'],
                    'tipo' => $row['tipo'],
                    'nivel' => $row['nivel'],
                    'titulo' => $row['titulo'],
                    'mensagem' => $row['mensagem'],
                    'valores' => [
                        'atual' => $row['valor_atual'] ? (float)$row['valor_atual'] : null,
                        'limite' => $row['valor_limite'] ? (float)$row['valor_limite'] : null
                    ],
                    'dispositivo' => [
                        'nome' => $row['nome_dispositivo'],
                        'localizacao' => $row['localizacao']
                    ],
                    'status' => [
                        'lido' => (bool)$row['lido'],
                        'resolvido' => (bool)$row['resolvido']
                    ],
                    'datas' => [
                        'criacao' => $row['data_criacao'],
                        'resolucao' => $row['data_resolucao'],
                        'tempo_decorrido' => calcularTempoDecorrido($row['data_criacao'])
                    ]
                ];
            }
            
            // Buscar contadores
            $sql_count = "SELECT 
                            COUNT(*) as total,
                            SUM(CASE WHEN lido = 0 THEN 1 ELSE 0 END) as nao_lidos,
                            SUM(CASE WHEN resolvido = 0 THEN 1 ELSE 0 END) as nao_resolvidos
                        FROM alertas 
                        WHERE usuario_id = ?";
            
            $stmt_count = $conexao->prepare($sql_count);
            $stmt_count->bind_param("i", $usuario_id);
            $stmt_count->execute();
            $contadores = $stmt_count->get_result()->fetch_assoc();
            
            $total_alertas = $contadores['total'];
            $tem_mais = ($offset + $limit) < $total_alertas;
            
            echo json_encode([
                'status' => 'sucesso',
                'mensagem' => 'Alertas listados com sucesso',
                'dados' => [
                    'alertas' => $alertas,
                    'contadores' => [
                        'total' => (int)$contadores['total'],
                        'nao_lidos' => (int)$contadores['nao_lidos'],
                        'nao_resolvidos' => (int)$contadores['nao_resolvidos']
                    ],
                    'paginacao' => [
                        'limit' => $limit,
                        'offset' => $offset,
                        'tem_mais' => $tem_mais
                    ]
                ],
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_UNESCAPED_UNICODE);
            break;
            
        case 'PUT':
            $alerta_id = $_GET['id'] ?? null;
            
            if (!$alerta_id) {
                throw new Exception('ID do alerta é obrigatório');
            }
            
            if (!$input) {
                throw new Exception('Dados para atualização são obrigatórios');
            }
            
            $campos = [];
            $params = [];
            $types = "";
            
            if (isset($input['lido'])) {
                $campos[] = "lido = ?";
                $params[] = $input['lido'] ? 1 : 0;
                $types .= "i";
            }
            
            if (isset($input['resolvido'])) {
                $campos[] = "resolvido = ?";
                $params[] = $input['resolvido'] ? 1 : 0;
                $types .= "i";
                
                if ($input['resolvido']) {
                    $campos[] = "data_resolucao = NOW()";
                }
            }
            
            if (empty($campos)) {
                throw new Exception('Nenhum campo para atualizar');
            }
            
            $sql = "UPDATE alertas SET " . implode(', ', $campos) . " WHERE id = ?";
            $stmt = $conexao->prepare($sql);
            $params[] = $alerta_id;
            $types .= "i";
            $stmt->bind_param($types, ...$params);
            $resultado = $stmt->execute();
            
            if ($resultado && $stmt->rowCount() > 0) {
                echo json_encode([
                    'status' => 'sucesso',
                    'mensagem' => 'Alerta atualizado com sucesso',
                    'timestamp' => date('Y-m-d H:i:s')
                ], JSON_UNESCAPED_UNICODE);
            } else {
                throw new Exception('Alerta não encontrado');
            }
            break;
            
        case 'POST':
            $acao = $input['acao'] ?? null;
            
            if ($acao === 'marcar_todos_lidos') {
                $usuario_id = $input['usuario_id'] ?? null;
                if (!$usuario_id) {
                    throw new Exception('ID do usuário é obrigatório');
                }
                
                $sql = "UPDATE alertas SET lido = 1 WHERE usuario_id = ? AND lido = 0";
                $stmt = $conexao->prepare($sql);
                $stmt->bind_param("i", $usuario_id);
                $resultado = $stmt->execute();
                
                echo json_encode([
                    'status' => 'sucesso',
                    'mensagem' => 'Todos os alertas foram marcados como lidos',
                    'timestamp' => date('Y-m-d H:i:s')
                ], JSON_UNESCAPED_UNICODE);
            } else {
                throw new Exception('Ação não reconhecida');
            }
            break;
            
        default:
            throw new Exception('Método não permitido');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'erro',
        'mensagem' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}

function calcularTempoDecorrido($data_criacao) {
    $agora = new DateTime();
    $criacao = new DateTime($data_criacao);
    $diferenca = $agora->diff($criacao);
    
    if ($diferenca->days > 0) {
        return $diferenca->days . ' dia' . ($diferenca->days > 1 ? 's' : '') . ' atrás';
    } elseif ($diferenca->h > 0) {
        return $diferenca->h . ' hora' . ($diferenca->h > 1 ? 's' : '') . ' atrás';
    } elseif ($diferenca->i > 0) {
        return $diferenca->i . ' min atrás';
    } else {
        return 'Agora mesmo';
    }
}

$conexao->close();
?>

