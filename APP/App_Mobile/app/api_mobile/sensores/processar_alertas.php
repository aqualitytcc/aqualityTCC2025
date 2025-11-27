<?php
/**
 * Script para processar alertas automaticamente quando chegam novas leituras
 * Este script deve ser chamado sempre que uma nova leitura for inserida
 */

require_once '../config.php';

class ProcessadorAlertasAutomatico {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Processa alertas para uma nova leitura
     */
    public function processarLeitura($dispositivo_id, $leitura) {
        try {
            // Buscar regras ativas para o dispositivo
            $regras = $this->buscarRegrasAtivas($dispositivo_id);
            
            $alertas_criados = [];
            
            foreach ($regras as $regra) {
                $alerta = $this->verificarRegra($regra, $leitura);
                
                if ($alerta) {
                    $alerta_id = $this->criarAlerta($alerta);
                    if ($alerta_id) {
                        $alertas_criados[] = $alerta_id;
                        
                        // Enviar notificação push
                        $this->enviarNotificacaoPush($alerta);
                    }
                }
            }
            
            return [
                'status' => 'sucesso',
                'alertas_criados' => count($alertas_criados),
                'ids_alertas' => $alertas_criados
            ];
            
        } catch (Exception $e) {
            error_log("Erro ao processar alertas: " . $e->getMessage());
            return [
                'status' => 'erro',
                'mensagem' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Busca regras ativas para o dispositivo
     */
    private function buscarRegrasAtivas($dispositivo_id) {
        $sql = "
            SELECT 
                ra.id,
                ra.usuario_id,
                ra.parametro,
                ra.condicao,
                ra.valor,
                d.nome_dispositivo,
                d.localizacao
            FROM regras_alerta ra
            LEFT JOIN dispositivos d ON ra.dispositivo_id = d.id
            WHERE ra.dispositivo_id = :dispositivo_id
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':dispositivo_id' => $dispositivo_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Verifica se uma regra deve gerar alerta
     */
    private function verificarRegra($regra, $leitura) {
        $parametro = $regra['parametro'];
        $valor_atual = null;
        
        // Obter valor atual do parâmetro
        switch ($parametro) {
            case 'temperatura':
                $valor_atual = $leitura['temperatura'] ?? null;
                break;
            case 'ph':
                $valor_atual = $leitura['ph'] ?? null;
                break;
            case 'turbidez':
                $valor_atual = $leitura['turbidez'] ?? null;
                break;
            case 'condutividade':
                $valor_atual = $leitura['condutividade'] ?? null;
                break;
        }
        
        if ($valor_atual === null) {
            return null; // Parâmetro não disponível na leitura
        }
        
        $valor_limite = (float)$regra['valor'];
        $condicao = $regra['condicao'];
        
        // Verificar condição
        $deve_alertar = false;
        switch ($condicao) {
            case 'maior_que':
                $deve_alertar = $valor_atual > $valor_limite;
                break;
            case 'menor_que':
                $deve_alertar = $valor_atual < $valor_limite;
                break;
            case 'igual_a':
                $deve_alertar = abs($valor_atual - $valor_limite) < 0.01; // Tolerância para float
                break;
            case 'diferente_de':
                $deve_alertar = abs($valor_atual - $valor_limite) >= 0.01;
                break;
        }
        
        if (!$deve_alertar) {
            return null;
        }
        
        // Verificar se já existe alerta similar recente (evitar spam)
        if ($this->existeAlertaRecente($regra['usuario_id'], $regra['id'], $parametro)) {
            return null;
        }
        
        // Criar dados do alerta
        return [
            'usuario_id' => $regra['usuario_id'],
            'dispositivo_id' => $regra['dispositivo_id'],
            'regra_id' => $regra['id'],
            'tipo' => 'qualidade_agua',
            'nivel' => $this->determinarNivelAlerta($parametro, $valor_atual, $valor_limite),
            'titulo' => $this->gerarTituloAlerta($parametro, $regra['nome_dispositivo']),
            'mensagem' => $this->gerarMensagemAlerta($parametro, $valor_atual, $valor_limite, $condicao, $regra['localizacao']),
            'valor_atual' => $valor_atual,
            'valor_limite' => $valor_limite
        ];
    }
    
    /**
     * Verifica se existe alerta similar recente
     */
    private function existeAlertaRecente($usuario_id, $regra_id, $parametro) {
        $sql = "
            SELECT id FROM alertas 
            WHERE usuario_id = :usuario_id 
            AND regra_id = :regra_id 
            AND tipo = 'qualidade_agua'
            AND data_criacao > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':usuario_id' => $usuario_id,
            ':regra_id' => $regra_id
        ]);
        
        return $stmt->fetch() !== false;
    }
    
    /**
     * Determina o nível do alerta
     */
    private function determinarNivelAlerta($parametro, $valor_atual, $valor_limite) {
        $diferenca_percentual = abs($valor_atual - $valor_limite) / $valor_limite * 100;
        
        if ($diferenca_percentual > 50) {
            return 'critical';
        } elseif ($diferenca_percentual > 20) {
            return 'warning';
        } else {
            return 'info';
        }
    }
    
    /**
     * Gera título do alerta
     */
    private function gerarTituloAlerta($parametro, $nome_dispositivo) {
        $nomes_parametros = [
            'temperatura' => 'Temperatura',
            'ph' => 'pH',
            'turbidez' => 'Turbidez',
            'condutividade' => 'Condutividade'
        ];
        
        $nome_parametro = $nomes_parametros[$parametro] ?? $parametro;
        return "Alerta de {$nome_parametro} - {$nome_dispositivo}";
    }
    
    /**
     * Gera mensagem do alerta
     */
    private function gerarMensagemAlerta($parametro, $valor_atual, $valor_limite, $condicao, $localizacao) {
        $nomes_parametros = [
            'temperatura' => 'temperatura',
            'ph' => 'pH',
            'turbidez' => 'turbidez',
            'condutividade' => 'condutividade'
        ];
        
        $unidades = [
            'temperatura' => '°C',
            'ph' => '',
            'turbidez' => 'NTU',
            'condutividade' => 'μS/cm'
        ];
        
        $nome_parametro = $nomes_parametros[$parametro] ?? $parametro;
        $unidade = $unidades[$parametro] ?? '';
        
        $simbolos_condicao = [
            'maior_que' => '>',
            'menor_que' => '<',
            'igual_a' => '=',
            'diferente_de' => '≠'
        ];
        
        $simbolo = $simbolos_condicao[$condicao] ?? $condicao;
        
        return "A {$nome_parametro} está em {$valor_atual}{$unidade}, {$simbolo} {$valor_limite}{$unidade} (limite configurado). Localização: {$localizacao}";
    }
    
    /**
     * Cria alerta no banco
     */
    private function criarAlerta($dados_alerta) {
        $sql = "
            INSERT INTO alertas 
            (usuario_id, dispositivo_id, regra_id, tipo, nivel, titulo, mensagem, valor_atual, valor_limite, data_criacao)
            VALUES (:usuario_id, :dispositivo_id, :regra_id, :tipo, :nivel, :titulo, :mensagem, :valor_atual, :valor_limite, NOW())
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $resultado = $stmt->execute([
            ':usuario_id' => $dados_alerta['usuario_id'],
            ':dispositivo_id' => $dados_alerta['dispositivo_id'],
            ':regra_id' => $dados_alerta['regra_id'],
            ':tipo' => $dados_alerta['tipo'],
            ':nivel' => $dados_alerta['nivel'],
            ':titulo' => $dados_alerta['titulo'],
            ':mensagem' => $dados_alerta['mensagem'],
            ':valor_atual' => $dados_alerta['valor_atual'],
            ':valor_limite' => $dados_alerta['valor_limite']
        ]);
        
        return $resultado ? $this->pdo->lastInsertId() : null;
    }
    
    /**
     * Envia notificação push (implementação básica)
     */
    private function enviarNotificacaoPush($alerta) {
        // Aqui você pode integrar com serviços como Firebase, OneSignal, etc.
        // Por enquanto, apenas log
        error_log("Push notification: {$alerta['titulo']} - {$alerta['mensagem']}");
        
        // Exemplo de integração com Firebase (descomente se necessário):
        /*
        $this->enviarFirebaseNotification([
            'title' => $alerta['titulo'],
            'body' => $alerta['mensagem'],
            'data' => [
                'tipo' => 'alerta',
                'nivel' => $alerta['nivel'],
                'dispositivo_id' => $alerta['dispositivo_id']
            ]
        ]);
        */
    }
}

// Função para ser chamada quando uma nova leitura for inserida
function processarAlertasParaLeitura($conexao, $dispositivo_id, $leitura) {
    try {
        // Buscar regras ativas para o dispositivo
        $sql_regras = "SELECT 
            ra.id,
            ra.usuario_id,
            ra.parametro,
            ra.condicao,
            ra.valor,
            d.nome_dispositivo,
            d.localizacao
        FROM regras_alerta ra
        LEFT JOIN dispositivos d ON ra.dispositivo_id = d.id
        WHERE ra.dispositivo_id = ?";
        
        $stmt_regras = $conexao->prepare($sql_regras);
        $stmt_regras->bind_param("i", $dispositivo_id);
        $stmt_regras->execute();
        $resultado_regras = $stmt_regras->get_result();
        
        $alertas_criados = [];
        
        while ($regra = $resultado_regras->fetch_assoc()) {
            $alerta = verificarRegra($regra, $leitura);
            
            if ($alerta) {
                $alerta_id = criarAlerta($conexao, $alerta);
                if ($alerta_id) {
                    $alertas_criados[] = $alerta_id;
                }
            }
        }
        
        return [
            'status' => 'sucesso',
            'alertas_criados' => count($alertas_criados),
            'ids_alertas' => $alertas_criados
        ];
        
    } catch (Exception $e) {
        log_error('Erro ao processar alertas', [
            'erro' => $e->getMessage(),
            'dispositivo_id' => $dispositivo_id
        ]);
        
        return [
            'status' => 'erro',
            'mensagem' => $e->getMessage()
        ];
    }
}

// Função para verificar se uma regra deve gerar alerta
function verificarRegra($regra, $leitura) {
    $parametro = $regra['parametro'];
    $valor_atual = null;
    
    // Obter valor atual do parâmetro
    switch ($parametro) {
        case 'temperatura':
            $valor_atual = $leitura['temperatura'] ?? null;
            break;
        case 'ph':
            $valor_atual = $leitura['ph'] ?? null;
            break;
        case 'turbidez':
            $valor_atual = $leitura['turbidez'] ?? null;
            break;
        case 'condutividade':
            $valor_atual = $leitura['condutividade'] ?? null;
            break;
    }
    
    if ($valor_atual === null) {
        return null; // Parâmetro não disponível na leitura
    }
    
    $valor_limite = (float)$regra['valor'];
    $condicao = $regra['condicao'];
    
    // Verificar condição
    $deve_alertar = false;
    switch ($condicao) {
        case 'maior_que':
            $deve_alertar = $valor_atual > $valor_limite;
            break;
        case 'menor_que':
            $deve_alertar = $valor_atual < $valor_limite;
            break;
        case 'igual_a':
            $deve_alertar = abs($valor_atual - $valor_limite) < 0.01;
            break;
        case 'diferente_de':
            $deve_alertar = abs($valor_atual - $valor_limite) >= 0.01;
            break;
    }
    
    if (!$deve_alertar) {
        return null;
    }
    
    // Determinar nível do alerta baseado no parâmetro e valor
    $nivel = determinarNivelAlerta($parametro, $valor_atual, $valor_limite);
    
    // Criar dados do alerta
    return [
        'usuario_id' => $regra['usuario_id'],
        'dispositivo_id' => $regra['dispositivo_id'],
        'regra_id' => $regra['id'],
        'tipo' => 'qualidade_agua',
        'nivel' => $nivel,
        'titulo' => gerarTituloAlerta($parametro, $condicao, $valor_atual),
        'mensagem' => gerarMensagemAlerta($parametro, $condicao, $valor_atual, $valor_limite, $regra),
        'valor_atual' => $valor_atual,
        'valor_limite' => $valor_limite
    ];
}

// Função para determinar o nível do alerta
function determinarNivelAlerta($parametro, $valor_atual, $valor_limite) {
    $diferenca_percentual = abs($valor_atual - $valor_limite) / $valor_limite * 100;
    
    // Valores críticos para cada parâmetro
    $limites_criticos = [
        'temperatura' => ['min' => 10, 'max' => 35],
        'ph' => ['min' => 6.0, 'max' => 9.0],
        'turbidez' => ['min' => 0, 'max' => 10],
        'condutividade' => ['min' => 0, 'max' => 2.5]
    ];
    
    if (isset($limites_criticos[$parametro])) {
        $limites = $limites_criticos[$parametro];
        if ($valor_atual < $limites['min'] || $valor_atual > $limites['max']) {
            return 'critical';
        }
    }
    
    if ($diferenca_percentual > 20) {
        return 'critical';
    } elseif ($diferenca_percentual > 10) {
        return 'warning';
    } else {
        return 'info';
    }
}

// Função para gerar título do alerta
function gerarTituloAlerta($parametro, $condicao, $valor_atual) {
    $parametros_nomes = [
        'temperatura' => 'Temperatura',
        'ph' => 'pH',
        'turbidez' => 'Turbidez',
        'condutividade' => 'Condutividade'
    ];
    
    $parametro_nome = $parametros_nomes[$parametro] ?? ucfirst($parametro);
    
    switch ($condicao) {
        case 'maior_que':
            return "{$parametro_nome} Elevado";
        case 'menor_que':
            return "{$parametro_nome} Baixo";
        case 'igual_a':
            return "{$parametro_nome} Crítico";
        case 'diferente_de':
            return "{$parametro_nome} Anômalo";
        default:
            return "Alerta de {$parametro_nome}";
    }
}

// Função para gerar mensagem do alerta
function gerarMensagemAlerta($parametro, $condicao, $valor_atual, $valor_limite, $regra) {
    $parametros_nomes = [
        'temperatura' => 'temperatura',
        'ph' => 'pH',
        'turbidez' => 'turbidez',
        'condutividade' => 'condutividade'
    ];
    
    $unidades = [
        'temperatura' => '°C',
        'ph' => '',
        'turbidez' => ' NTU',
        'condutividade' => ' mS/cm'
    ];
    
    $parametro_nome = $parametros_nomes[$parametro] ?? $parametro;
    $unidade = $unidades[$parametro] ?? '';
    $dispositivo_nome = $regra['nome_dispositivo'] ?? 'Dispositivo';
    
    $mensagem = "Valor de {$parametro_nome} ";
    
    switch ($condicao) {
        case 'maior_que':
            $mensagem .= "acima do limite: {$valor_atual}{$unidade} (limite: {$valor_limite}{$unidade})";
            break;
        case 'menor_que':
            $mensagem .= "abaixo do limite: {$valor_atual}{$unidade} (limite: {$valor_limite}{$unidade})";
            break;
        case 'igual_a':
            $mensagem .= "igual ao valor crítico: {$valor_atual}{$unidade}";
            break;
        case 'diferente_de':
            $mensagem .= "diferente do esperado: {$valor_atual}{$unidade} (esperado: {$valor_limite}{$unidade})";
            break;
    }
    
    $mensagem .= " no dispositivo {$dispositivo_nome}.";
    
    return $mensagem;
}

// Função para criar alerta no banco
function criarAlerta($conexao, $dados_alerta) {
    try {
        $sql = "INSERT INTO alertas (
            usuario_id, 
            dispositivo_id, 
            regra_id, 
            tipo, 
            nivel, 
            titulo, 
            mensagem, 
            valor_atual, 
            valor_limite, 
            data_criacao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param(
            "iiissssdd",
            $dados_alerta['usuario_id'],
            $dados_alerta['dispositivo_id'],
            $dados_alerta['regra_id'],
            $dados_alerta['tipo'],
            $dados_alerta['nivel'],
            $dados_alerta['titulo'],
            $dados_alerta['mensagem'],
            $dados_alerta['valor_atual'],
            $dados_alerta['valor_limite']
        );
        
        if ($stmt->execute()) {
            $alerta_id = $conexao->insert_id;
            
            log_error('Alerta criado com sucesso', [
                'alerta_id' => $alerta_id,
                'usuario_id' => $dados_alerta['usuario_id'],
                'dispositivo_id' => $dados_alerta['dispositivo_id'],
                'nivel' => $dados_alerta['nivel'],
                'parametro' => $dados_alerta['titulo']
            ]);
            
            return $alerta_id;
        }
        
        return false;
        
    } catch (Exception $e) {
        log_error('Erro ao criar alerta', [
            'erro' => $e->getMessage(),
            'dados_alerta' => $dados_alerta
        ]);
        return false;
    }
}
?>
