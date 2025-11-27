<?php
/**
 * API para Buscar Dados dos Sensores - Water Sense Mobile
 * Endpoint para o app mobile obter leituras dos dispositivos
 * Adaptado para a estrutura do banco existente
 */

require_once __DIR__ . '/../config.php';

// Configura CORS e headers
configurar_cors();

/**
 * Permite apenas método GET
 */
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    enviar_resposta(405, 'erro', 'Método não permitido. Use GET.');
}

// Conecta ao banco de dados
$conexao = conectar_banco();
if (!$conexao) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.');
}

// Parâmetros da URL
$usuario_id = $_GET['usuario_id'] ?? null;
$dispositivo_id = $_GET['dispositivo_id'] ?? null;
$tipo = $_GET['tipo'] ?? 'ultimas'; // 'ultimas', 'historico', 'estatisticas'
$limit = intval($_GET['limit'] ?? 10);
$offset = intval($_GET['offset'] ?? 0);
$data_inicio = $_GET['data_inicio'] ?? null;
$data_fim = $_GET['data_fim'] ?? null;

// Validação básica
if (!$usuario_id) {
    enviar_resposta(400, 'erro', 'ID do usuário é obrigatório.');
}

// Limita o número máximo de registros
$limit = min($limit, 100);

// Processa diferentes tipos de consulta
switch ($tipo) {
    case 'ultimas':
        buscar_ultimas_leituras($conexao, $usuario_id, $dispositivo_id);
        break;
    case 'historico':
        buscar_historico($conexao, $usuario_id, $dispositivo_id, $limit, $offset, $data_inicio, $data_fim);
        break;
    case 'estatisticas':
        buscar_estatisticas($conexao, $usuario_id, $dispositivo_id, $data_inicio, $data_fim);
        break;
    default:
        enviar_resposta(400, 'erro', 'Tipo de consulta inválido. Use: ultimas, historico ou estatisticas');
}

/**
 * Busca as últimas leituras de todos os dispositivos do usuário
 */
function buscar_ultimas_leituras($conexao, $usuario_id, $dispositivo_id = null) {
    try {
        $sql = "SELECT 
                    d.id as dispositivo_id,
                    d.codigo_verificacao as nome,
                    d.codigo_verificacao,
                    d.localizacao,
                    d.data_criacao,
                    l.id as leitura_id,
                    l.ph,
                    l.turbidez,
                    l.condutividade,
                    l.temperatura,
                    l.data_hora as timestamp_leitura,
                    CASE 
                        WHEN l.data_hora >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'recente'
                        WHEN l.data_hora >= DATE_SUB(NOW(), INTERVAL 30 MINUTE) THEN 'moderado'
                        ELSE 'antigo'
                    END as status_leitura
                FROM dispositivos d
                LEFT JOIN leitura l ON d.id = l.dispositivo_id 
                    AND l.id = (
                        SELECT MAX(l2.id) 
                        FROM leitura l2 
                        WHERE l2.dispositivo_id = d.id
                    )
                WHERE d.usuario_id = ?";
        
        $params = [$usuario_id];
        $types = "i";
        
        if ($dispositivo_id) {
            $sql .= " AND d.id = ?";
            $params[] = $dispositivo_id;
            $types .= "i";
        }
        
        $sql .= " ORDER BY d.data_criacao DESC";
        
        $stmt = $conexao->prepare($sql);
        if (!$stmt) {
            throw new Exception('Erro ao preparar consulta: ' . $conexao->error);
        }
        
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $resultado = $stmt->get_result();
        
        $dispositivos = [];
        while ($row = $resultado->fetch_assoc()) {
            // Determina status do dispositivo baseado na última leitura
            $status = 'offline';
            if ($row['timestamp_leitura']) {
                $ultima_leitura = new DateTime($row['timestamp_leitura']);
                $agora = new DateTime();
                $diferenca = $agora->diff($ultima_leitura);
                
                // Considera online se teve leitura nos últimos 10 minutos
                if ($diferenca->i < 10 && $diferenca->h == 0 && $diferenca->days == 0) {
                    $status = 'online';
                }
            }
            
            $dispositivo = [
                'id' => intval($row['dispositivo_id']),
                'nome' => $row['nome'] ?: 'Dispositivo ' . $row['dispositivo_id'],
                'codigo_dispositivo' => $row['codigo_verificacao'],
                'localizacao' => $row['localizacao'] ?: 'Não informado',
                'status' => $status,
                'nivel_bateria' => 85, // Valor padrão
                'data_criacao' => $row['data_criacao']
            ];
            
            // Adiciona dados da leitura se existir
            if ($row['leitura_id']) {
                $dispositivo['leitura_atual'] = [
                    'ph' => [
                        'valor' => floatval($row['ph']),
                        'status' => calcular_status_parametro($row['ph'], 'ph'),
                        'unidade' => ''
                    ],
                    'turbidez' => [
                        'valor' => floatval($row['turbidez']),
                        'status' => calcular_status_parametro($row['turbidez'], 'turbidez'),
                        'unidade' => 'NTU'
                    ],
                    'condutividade' => [
                        'valor' => floatval($row['condutividade']),
                        'status' => calcular_status_parametro($row['condutividade'], 'condutividade'),
                        'unidade' => 'mS/cm'
                    ],
                    'temperatura' => [
                        'valor' => floatval($row['temperatura']),
                        'status' => calcular_status_parametro($row['temperatura'], 'temperatura'),
                        'unidade' => '°C'
                    ],
                    'timestamp' => $row['timestamp_leitura']
                ];
            } else {
                $dispositivo['leitura_atual'] = null;
            }
            
            $dispositivos[] = $dispositivo;
        }
        
        log_error('Últimas leituras buscadas com sucesso', [
            'usuario_id' => $usuario_id,
            'total_dispositivos' => count($dispositivos)
        ]);
        
        enviar_resposta(200, 'sucesso', 'Últimas leituras obtidas com sucesso', $dispositivos);
        
    } catch (Exception $e) {
        log_error('Erro ao buscar últimas leituras', [
            'erro' => $e->getMessage(),
            'usuario_id' => $usuario_id
        ]);
        
        enviar_resposta(500, 'erro', 'Erro interno do servidor');
    }
}

/**
 * Busca histórico de leituras de um dispositivo específico
 */
function buscar_historico($conexao, $usuario_id, $dispositivo_id, $limit, $offset, $data_inicio, $data_fim) {
    if (!$dispositivo_id) {
        enviar_resposta(400, 'erro', 'ID do dispositivo é obrigatório para consulta de histórico.');
    }
    
    try {
        // Verifica se o dispositivo pertence ao usuário
        $sql_check = "SELECT id FROM dispositivos WHERE id = ? AND usuario_id = ?";
        $stmt_check = $conexao->prepare($sql_check);
        $stmt_check->bind_param("ii", $dispositivo_id, $usuario_id);
        $stmt_check->execute();
        
        if ($stmt_check->get_result()->num_rows === 0) {
            enviar_resposta(404, 'erro', 'Dispositivo não encontrado ou não pertence ao usuário.');
        }
        
        // Monta a consulta do histórico
        $sql = "SELECT 
                    l.id,
                    l.ph,
                    l.turbidez,
                    l.condutividade,
                    l.temperatura,
                    l.data_hora as timestamp
                FROM leitura l
                WHERE l.dispositivo_id = ?";
        
        $params = [$dispositivo_id];
        $types = "i";
        
        if ($data_inicio) {
            $sql .= " AND l.data_hora >= ?";
            $params[] = $data_inicio;
            $types .= "s";
        }
        
        if ($data_fim) {
            $sql .= " AND l.data_hora <= ?";
            $params[] = $data_fim;
            $types .= "s";
        }
        
        $sql .= " ORDER BY l.data_hora DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= "ii";
        
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $resultado = $stmt->get_result();
        
        $historico = [];
        while ($row = $resultado->fetch_assoc()) {
            $historico[] = [
                'id' => intval($row['id']),
                'ph' => floatval($row['ph']),
                'turbidez' => floatval($row['turbidez']),
                'condutividade' => floatval($row['condutividade']),
                'temperatura' => floatval($row['temperatura']),
                'timestamp' => $row['timestamp']
            ];
        }
        
        // Conta total de registros para paginação
        $sql_count = "SELECT COUNT(*) as total FROM leitura l 
                      WHERE l.dispositivo_id = ?";
        $count_params = [$dispositivo_id];
        $count_types = "i";
        
        if ($data_inicio) {
            $sql_count .= " AND l.data_hora >= ?";
            $count_params[] = $data_inicio;
            $count_types .= "s";
        }
        
        if ($data_fim) {
            $sql_count .= " AND l.data_hora <= ?";
            $count_params[] = $data_fim;
            $count_types .= "s";
        }
        
        $stmt_count = $conexao->prepare($sql_count);
        $stmt_count->bind_param($count_types, ...$count_params);
        $stmt_count->execute();
        $total = $stmt_count->get_result()->fetch_assoc()['total'];
        
        $dados_resposta = [
            'historico' => $historico,
            'paginacao' => [
                'total' => intval($total),
                'limit' => $limit,
                'offset' => $offset,
                'tem_mais' => ($offset + $limit) < $total
            ]
        ];
        
        log_error('Histórico buscado com sucesso', [
            'usuario_id' => $usuario_id,
            'dispositivo_id' => $dispositivo_id,
            'total_registros' => count($historico)
        ]);
        
        enviar_resposta(200, 'sucesso', 'Histórico obtido com sucesso', $dados_resposta);
        
    } catch (Exception $e) {
        log_error('Erro ao buscar histórico', [
            'erro' => $e->getMessage(),
            'usuario_id' => $usuario_id,
            'dispositivo_id' => $dispositivo_id
        ]);
        
        enviar_resposta(500, 'erro', 'Erro interno do servidor');
    }
}

/**
 * Busca estatísticas dos sensores
 */
function buscar_estatisticas($conexao, $usuario_id, $dispositivo_id, $data_inicio, $data_fim) {
    try {
        $sql = "SELECT 
                    d.id as dispositivo_id,
                    d.codigo_verificacao as dispositivo_nome,
                    COUNT(l.id) as total_leituras,
                    AVG(l.ph) as ph_medio,
                    MIN(l.ph) as ph_minimo,
                    MAX(l.ph) as ph_maximo,
                    AVG(l.turbidez) as turbidez_media,
                    MIN(l.turbidez) as turbidez_minima,
                    MAX(l.turbidez) as turbidez_maxima,
                    AVG(l.condutividade) as condutividade_media,
                    MIN(l.condutividade) as condutividade_minima,
                    MAX(l.condutividade) as condutividade_maxima,
                    AVG(l.temperatura) as temperatura_media,
                    MIN(l.temperatura) as temperatura_minima,
                    MAX(l.temperatura) as temperatura_maxima,
                    MIN(l.data_hora) as primeira_leitura,
                    MAX(l.data_hora) as ultima_leitura
                FROM dispositivos d
                LEFT JOIN leitura l ON d.id = l.dispositivo_id 
                WHERE d.usuario_id = ?";
        
        $params = [$usuario_id];
        $types = "i";
        
        if ($dispositivo_id) {
            $sql .= " AND d.id = ?";
            $params[] = $dispositivo_id;
            $types .= "i";
        }
        
        if ($data_inicio) {
            $sql .= " AND l.data_hora >= ?";
            $params[] = $data_inicio;
            $types .= "s";
        }
        
        if ($data_fim) {
            $sql .= " AND l.data_hora <= ?";
            $params[] = $data_fim;
            $types .= "s";
        }
        
        $sql .= " GROUP BY d.id, d.codigo_verificacao ORDER BY d.data_criacao";
        
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $resultado = $stmt->get_result();
        
        $estatisticas = [];
        while ($row = $resultado->fetch_assoc()) {
            $estatisticas[] = [
                'dispositivo_id' => intval($row['dispositivo_id']),
                'dispositivo_nome' => $row['dispositivo_nome'],
                'total_leituras' => intval($row['total_leituras']),
                'periodo' => [
                    'inicio' => $row['primeira_leitura'],
                    'fim' => $row['ultima_leitura']
                ],
                'ph' => [
                    'medio' => $row['ph_medio'] ? round(floatval($row['ph_medio']), 2) : null,
                    'minimo' => $row['ph_minimo'] ? floatval($row['ph_minimo']) : null,
                    'maximo' => $row['ph_maximo'] ? floatval($row['ph_maximo']) : null
                ],
                'turbidez' => [
                    'media' => $row['turbidez_media'] ? round(floatval($row['turbidez_media']), 2) : null,
                    'minima' => $row['turbidez_minima'] ? floatval($row['turbidez_minima']) : null,
                    'maxima' => $row['turbidez_maxima'] ? floatval($row['turbidez_maxima']) : null
                ],
                'condutividade' => [
                    'media' => $row['condutividade_media'] ? round(floatval($row['condutividade_media']), 4) : null,
                    'minima' => $row['condutividade_minima'] ? floatval($row['condutividade_minima']) : null,
                    'maxima' => $row['condutividade_maxima'] ? floatval($row['condutividade_maxima']) : null
                ],
                'temperatura' => [
                    'media' => $row['temperatura_media'] ? round(floatval($row['temperatura_media']), 1) : null,
                    'minima' => $row['temperatura_minima'] ? floatval($row['temperatura_minima']) : null,
                    'maxima' => $row['temperatura_maxima'] ? floatval($row['temperatura_maxima']) : null
                ]
            ];
        }
        
        log_error('Estatísticas buscadas com sucesso', [
            'usuario_id' => $usuario_id,
            'total_dispositivos' => count($estatisticas)
        ]);
        
        enviar_resposta(200, 'sucesso', 'Estatísticas obtidas com sucesso', $estatisticas);
        
    } catch (Exception $e) {
        log_error('Erro ao buscar estatísticas', [
            'erro' => $e->getMessage(),
            'usuario_id' => $usuario_id
        ]);
        
        enviar_resposta(500, 'erro', 'Erro interno do servidor');
    }
}

/**
 * Calcula o status de um parâmetro baseado em valores de referência
 */
function calcular_status_parametro($valor, $parametro) {
    if ($valor === null) return 'unknown';
    
    $limites = [
        'ph' => ['critico_min' => 6.0, 'min' => 6.5, 'max' => 8.5, 'critico_max' => 9.0],
        'turbidez' => ['critico_min' => 0, 'min' => 0, 'max' => 5, 'critico_max' => 10],
        'condutividade' => ['critico_min' => 0, 'min' => 0, 'max' => 2.0, 'critico_max' => 2.5],
        'temperatura' => ['critico_min' => 10, 'min' => 15, 'max' => 25, 'critico_max' => 30]
    ];
    
    if (!isset($limites[$parametro])) return 'unknown';
    
    $limite = $limites[$parametro];
    
    if ($valor < $limite['critico_min'] || $valor > $limite['critico_max']) {
        return 'danger';
    } elseif ($valor < $limite['min'] || $valor > $limite['max']) {
        return 'warning';
    } else {
        return 'normal';
    }
}

$conexao->close();
?>