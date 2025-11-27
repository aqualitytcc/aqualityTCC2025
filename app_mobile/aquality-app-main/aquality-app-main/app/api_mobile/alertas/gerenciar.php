<?php
/**
 * API para gerenciar alertas e notificações
 * Endpoints: GET, POST, PUT, DELETE
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Tratar requisições OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

class AlertaManager {
    private $conexao;
    
    public function __construct($conexao) {
        $this->conexao = $conexao;
    }
    
    /**
     * Lista alertas do usuário
     */
    public function listarAlertas($usuario_id, $apenas_nao_lidos = false, $limit = 20, $offset = 0) {
        try {
            $where_conditions = ["a.usuario_id = ?"];
            $params = [$usuario_id];
            $types = "i";
            
            if ($apenas_nao_lidos) {
                $where_conditions[] = "a.lido = 0";
            }
            
            $where_clause = implode(' AND ', $where_conditions);
            
            // Query principal para buscar alertas
            $sql = "
                SELECT 
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
                    d.nome_dispositivo,
                    d.localizacao,
                    ra.parametro,
                    ra.condicao,
                    ra.valor as valor_regra
                FROM alertas a
                LEFT JOIN dispositivos d ON a.dispositivo_id = d.id
                LEFT JOIN regras_alerta ra ON a.regra_id = ra.id
                WHERE {$where_clause}
                ORDER BY a.data_criacao DESC
                LIMIT ? OFFSET ?
            ";
            
            $stmt = $this->conexao->prepare($sql);
            $stmt->bind_param($types . "ii", ...$params, $limit, $offset);
            $stmt->execute();
            $resultado = $stmt->get_result();
            $alertas = [];
            while ($row = $resultado->fetch_assoc()) {
                $alertas[] = $row;
            }
            
            // Buscar contadores
            $contadores = $this->buscarContadores($usuario_id);
            
            // Calcular paginação
            $total_alertas = $contadores['total'];
            $tem_mais = ($offset + $limit) < $total_alertas;
            
            return [
                'status' => 'sucesso',
                'mensagem' => 'Alertas listados com sucesso',
                'dados' => [
                    'alertas' => $this->formatarAlertas($alertas),
                    'contadores' => $contadores,
                    'paginacao' => [
                        'limit' => $limit,
                        'offset' => $offset,
                        'tem_mais' => $tem_mais
                    ]
                ],
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'erro',
                'mensagem' => 'Erro ao listar alertas: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    /**
     * Busca contadores de alertas
     */
    private function buscarContadores($usuario_id) {
        $sql = "
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN lido = 0 THEN 1 ELSE 0 END) as nao_lidos,
                SUM(CASE WHEN resolvido = 0 THEN 1 ELSE 0 END) as nao_resolvidos
            FROM alertas 
            WHERE usuario_id = ?
        ";
        
        $stmt = $this->conexao->prepare($sql);
        $stmt->bind_param("i", $usuario_id);
        $stmt->execute();
        $resultado = $stmt->get_result();
        return $resultado->fetch_assoc();
    }
    
    /**
     * Formata alertas para resposta
     */
    private function formatarAlertas($alertas) {
        return array_map(function($alerta) {
            return [
                'id' => (int)$alerta['id'],
                'tipo' => $alerta['tipo'],
                'nivel' => $alerta['nivel'],
                'titulo' => $alerta['titulo'],
                'mensagem' => $alerta['mensagem'],
                'valores' => [
                    'atual' => $alerta['valor_atual'] ? (float)$alerta['valor_atual'] : null,
                    'limite' => $alerta['valor_limite'] ? (float)$alerta['valor_limite'] : null
                ],
                'dispositivo' => [
                    'nome' => $alerta['nome_dispositivo'],
                    'localizacao' => $alerta['localizacao']
                ],
                'status' => [
                    'lido' => (bool)$alerta['lido'],
                    'resolvido' => (bool)$alerta['resolvido']
                ],
                'datas' => [
                    'criacao' => $alerta['data_criacao'],
                    'resolucao' => $alerta['data_resolucao'],
                    'tempo_decorrido' => $this->calcularTempoDecorrido($alerta['data_criacao'])
                ]
            ];
        }, $alertas);
    }
    
    /**
     * Calcula tempo decorrido
     */
    private function calcularTempoDecorrido($data_criacao) {
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
    
    /**
     * Atualiza status do alerta
     */
    public function atualizarAlerta($alerta_id, $dados) {
        try {
            $campos = [];
            $params = [];
            $types = "";
            
            if (isset($dados['lido'])) {
                $campos[] = "lido = ?";
                $params[] = $dados['lido'] ? 1 : 0;
                $types .= "i";
            }
            
            if (isset($dados['resolvido'])) {
                $campos[] = "resolvido = ?";
                $params[] = $dados['resolvido'] ? 1 : 0;
                $types .= "i";
                
                if ($dados['resolvido']) {
                    $campos[] = "data_resolucao = NOW()";
                }
            }
            
            if (empty($campos)) {
                return [
                    'status' => 'erro',
                    'mensagem' => 'Nenhum campo para atualizar',
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            }
            
            $sql = "UPDATE alertas SET " . implode(', ', $campos) . " WHERE id = ?";
            $stmt = $this->conexao->prepare($sql);
            $params[] = $alerta_id;
            $types .= "i";
            $stmt->bind_param($types, ...$params);
            $resultado = $stmt->execute();
            
            if ($resultado && $stmt->rowCount() > 0) {
                return [
                    'status' => 'sucesso',
                    'mensagem' => 'Alerta atualizado com sucesso',
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            } else {
                return [
                    'status' => 'erro',
                    'mensagem' => 'Alerta não encontrado',
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            }
            
        } catch (Exception $e) {
            return [
                'status' => 'erro',
                'mensagem' => 'Erro ao atualizar alerta: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    /**
     * Marca todos os alertas como lidos
     */
    public function marcarTodosComoLidos($usuario_id) {
        try {
            $sql = "UPDATE alertas SET lido = 1 WHERE usuario_id = ? AND lido = 0";
            $stmt = $this->conexao->prepare($sql);
            $stmt->bind_param("i", $usuario_id);
            $resultado = $stmt->execute();
            
            return [
                'status' => 'sucesso',
                'mensagem' => 'Todos os alertas foram marcados como lidos',
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'erro',
                'mensagem' => 'Erro ao marcar alertas como lidos: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
}

// Processar requisição
try {
    $alertaManager = new AlertaManager($conexao);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'GET':
            $usuario_id = $_GET['usuario_id'] ?? null;
            $apenas_nao_lidos = filter_var($_GET['apenas_nao_lidos'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $limit = (int)($_GET['limit'] ?? 20);
            $offset = (int)($_GET['offset'] ?? 0);
            
            if (!$usuario_id) {
                throw new Exception('ID do usuário é obrigatório');
            }
            
            $resultado = $alertaManager->listarAlertas($usuario_id, $apenas_nao_lidos, $limit, $offset);
            break;
            
        case 'PUT':
            $alerta_id = $_GET['id'] ?? null;
            
            if (!$alerta_id) {
                throw new Exception('ID do alerta é obrigatório');
            }
            
            if (!$input) {
                throw new Exception('Dados para atualização são obrigatórios');
            }
            
            $resultado = $alertaManager->atualizarAlerta($alerta_id, $input);
            break;
            
        case 'POST':
            $acao = $input['acao'] ?? null;
            
            if ($acao === 'marcar_todos_lidos') {
                $usuario_id = $input['usuario_id'] ?? null;
                if (!$usuario_id) {
                    throw new Exception('ID do usuário é obrigatório');
                }
                $resultado = $alertaManager->marcarTodosComoLidos($usuario_id);
            } else {
                throw new Exception('Ação não reconhecida');
            }
            break;
            
        default:
            throw new Exception('Método não permitido');
    }
    
    echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'erro',
        'mensagem' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}
?>
