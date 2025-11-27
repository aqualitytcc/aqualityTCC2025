<?php
/**
 * API para gerenciar regras de alerta
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

class RegraAlertaManager {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Lista regras de alerta do usuário
     */
    public function listarRegras($usuario_id, $dispositivo_id = null) {
        try {
            $where_conditions = ["ra.usuario_id = :usuario_id"];
            $params = [':usuario_id' => $usuario_id];
            
            if ($dispositivo_id) {
                $where_conditions[] = "ra.dispositivo_id = :dispositivo_id";
                $params[':dispositivo_id'] = $dispositivo_id;
            }
            
            $where_clause = implode(' AND ', $where_conditions);
            
            $sql = "
                SELECT 
                    ra.id,
                    ra.dispositivo_id,
                    ra.parametro,
                    ra.condicao,
                    ra.valor,
                    ra.data_criacao,
                    d.nome_dispositivo,
                    d.localizacao
                FROM regras_alerta ra
                LEFT JOIN dispositivos d ON ra.dispositivo_id = d.id
                WHERE {$where_clause}
                ORDER BY ra.data_criacao DESC
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $regras = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'status' => 'sucesso',
                'mensagem' => 'Regras listadas com sucesso',
                'dados' => $this->formatarRegras($regras),
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
        } catch (Exception $e) {
            return [
                'status' => 'erro',
                'mensagem' => 'Erro ao listar regras: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    /**
     * Cria nova regra de alerta
     */
    public function criarRegra($dados) {
        try {
            // Validar dados obrigatórios
            $campos_obrigatorios = ['usuario_id', 'dispositivo_id', 'parametro', 'condicao', 'valor'];
            foreach ($campos_obrigatorios as $campo) {
                if (!isset($dados[$campo]) || $dados[$campo] === '') {
                    throw new Exception("Campo '{$campo}' é obrigatório");
                }
            }
            
            // Verificar se já existe regra similar
            $sql_verificar = "
                SELECT id FROM regras_alerta 
                WHERE usuario_id = :usuario_id 
                AND dispositivo_id = :dispositivo_id 
                AND parametro = :parametro
            ";
            $stmt_verificar = $this->pdo->prepare($sql_verificar);
            $stmt_verificar->execute([
                ':usuario_id' => $dados['usuario_id'],
                ':dispositivo_id' => $dados['dispositivo_id'],
                ':parametro' => $dados['parametro']
            ]);
            
            if ($stmt_verificar->fetch()) {
                throw new Exception('Já existe uma regra para este parâmetro neste dispositivo');
            }
            
            // Inserir nova regra
            $sql = "
                INSERT INTO regras_alerta 
                (usuario_id, dispositivo_id, parametro, condicao, valor, data_criacao)
                VALUES (:usuario_id, :dispositivo_id, :parametro, :condicao, :valor, NOW())
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $resultado = $stmt->execute([
                ':usuario_id' => $dados['usuario_id'],
                ':dispositivo_id' => $dados['dispositivo_id'],
                ':parametro' => $dados['parametro'],
                ':condicao' => $dados['condicao'],
                ':valor' => $dados['valor']
            ]);
            
            if ($resultado) {
                $regra_id = $this->pdo->lastInsertId();
                return [
                    'status' => 'sucesso',
                    'mensagem' => 'Regra criada com sucesso',
                    'dados' => ['id' => $regra_id],
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            } else {
                throw new Exception('Erro ao inserir regra');
            }
            
        } catch (Exception $e) {
            return [
                'status' => 'erro',
                'mensagem' => 'Erro ao criar regra: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    /**
     * Atualiza regra existente
     */
    public function atualizarRegra($regra_id, $dados) {
        try {
            $campos = [];
            $params = [':id' => $regra_id];
            
            if (isset($dados['parametro'])) {
                $campos[] = "parametro = :parametro";
                $params[':parametro'] = $dados['parametro'];
            }
            
            if (isset($dados['condicao'])) {
                $campos[] = "condicao = :condicao";
                $params[':condicao'] = $dados['condicao'];
            }
            
            if (isset($dados['valor'])) {
                $campos[] = "valor = :valor";
                $params[':valor'] = $dados['valor'];
            }
            
            if (empty($campos)) {
                return [
                    'status' => 'erro',
                    'mensagem' => 'Nenhum campo para atualizar',
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            }
            
            $sql = "UPDATE regras_alerta SET " . implode(', ', $campos) . " WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $resultado = $stmt->execute($params);
            
            if ($resultado && $stmt->rowCount() > 0) {
                return [
                    'status' => 'sucesso',
                    'mensagem' => 'Regra atualizada com sucesso',
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            } else {
                return [
                    'status' => 'erro',
                    'mensagem' => 'Regra não encontrada',
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            }
            
        } catch (Exception $e) {
            return [
                'status' => 'erro',
                'mensagem' => 'Erro ao atualizar regra: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    /**
     * Remove regra
     */
    public function removerRegra($regra_id) {
        try {
            $sql = "DELETE FROM regras_alerta WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $resultado = $stmt->execute([':id' => $regra_id]);
            
            if ($resultado && $stmt->rowCount() > 0) {
                return [
                    'status' => 'sucesso',
                    'mensagem' => 'Regra removida com sucesso',
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            } else {
                return [
                    'status' => 'erro',
                    'mensagem' => 'Regra não encontrada',
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            }
            
        } catch (Exception $e) {
            return [
                'status' => 'erro',
                'mensagem' => 'Erro ao remover regra: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    /**
     * Formata regras para resposta
     */
    private function formatarRegras($regras) {
        return array_map(function($regra) {
            return [
                'id' => (int)$regra['id'],
                'dispositivo_id' => (int)$regra['dispositivo_id'],
                'parametro' => $regra['parametro'],
                'condicao' => $regra['condicao'],
                'valor' => (float)$regra['valor'],
                'data_criacao' => $regra['data_criacao'],
                'dispositivo' => [
                    'nome' => $regra['nome_dispositivo'],
                    'localizacao' => $regra['localizacao']
                ]
            ];
        }, $regras);
    }
    
    /**
     * Lista parâmetros disponíveis
     */
    public function listarParametros() {
        $parametros = [
            [
                'codigo' => 'temperatura',
                'nome' => 'Temperatura',
                'unidade' => '°C',
                'descricao' => 'Temperatura da água'
            ],
            [
                'codigo' => 'ph',
                'nome' => 'pH',
                'unidade' => '',
                'descricao' => 'Nível de acidez da água'
            ],
            [
                'codigo' => 'turbidez',
                'nome' => 'Turbidez',
                'unidade' => 'NTU',
                'descricao' => 'Clareza da água'
            ],
            [
                'codigo' => 'condutividade',
                'nome' => 'Condutividade',
                'unidade' => 'μS/cm',
                'descricao' => 'Capacidade de conduzir corrente elétrica'
            ]
        ];
        
        return [
            'status' => 'sucesso',
            'mensagem' => 'Parâmetros listados com sucesso',
            'dados' => $parametros,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Lista condições disponíveis
     */
    public function listarCondicoes() {
        $condicoes = [
            [
                'codigo' => 'maior_que',
                'nome' => 'Maior que',
                'simbolo' => '>',
                'descricao' => 'Valor maior que o limite'
            ],
            [
                'codigo' => 'menor_que',
                'nome' => 'Menor que',
                'simbolo' => '<',
                'descricao' => 'Valor menor que o limite'
            ],
            [
                'codigo' => 'igual_a',
                'nome' => 'Igual a',
                'simbolo' => '=',
                'descricao' => 'Valor igual ao limite'
            ],
            [
                'codigo' => 'diferente_de',
                'nome' => 'Diferente de',
                'simbolo' => '≠',
                'descricao' => 'Valor diferente do limite'
            ]
        ];
        
        return [
            'status' => 'sucesso',
            'mensagem' => 'Condições listadas com sucesso',
            'dados' => $condicoes,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}

// Processar requisição
try {
    $regraManager = new RegraAlertaManager($pdo);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'GET':
            $acao = $_GET['acao'] ?? 'listar';
            
            switch ($acao) {
                case 'listar':
                    $usuario_id = $_GET['usuario_id'] ?? null;
                    $dispositivo_id = $_GET['dispositivo_id'] ?? null;
                    
                    if (!$usuario_id) {
                        throw new Exception('ID do usuário é obrigatório');
                    }
                    
                    $resultado = $regraManager->listarRegras($usuario_id, $dispositivo_id);
                    break;
                    
                case 'parametros':
                    $resultado = $regraManager->listarParametros();
                    break;
                    
                case 'condicoes':
                    $resultado = $regraManager->listarCondicoes();
                    break;
                    
                default:
                    throw new Exception('Ação não reconhecida');
            }
            break;
            
        case 'POST':
            if (!$input) {
                throw new Exception('Dados são obrigatórios');
            }
            
            $resultado = $regraManager->criarRegra($input);
            break;
            
        case 'PUT':
            $regra_id = $_GET['id'] ?? null;
            
            if (!$regra_id) {
                throw new Exception('ID da regra é obrigatório');
            }
            
            if (!$input) {
                throw new Exception('Dados para atualização são obrigatórios');
            }
            
            $resultado = $regraManager->atualizarRegra($regra_id, $input);
            break;
            
        case 'DELETE':
            $regra_id = $_GET['id'] ?? null;
            
            if (!$regra_id) {
                throw new Exception('ID da regra é obrigatório');
            }
            
            $resultado = $regraManager->removerRegra($regra_id);
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
