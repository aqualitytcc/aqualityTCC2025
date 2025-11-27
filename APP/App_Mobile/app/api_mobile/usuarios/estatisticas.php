<?php
/**
 * API para Estatísticas do Usuário - Water Sense Mobile
 * Busca estatísticas agregadas para exibir no perfil do usuário
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

// Validação básica
if (!$usuario_id) {
    enviar_resposta(400, 'erro', 'ID do usuário é obrigatório.');
}

try {
    // Busca informações básicas do usuário (apenas colunas que existem)
    $sql_usuario = "SELECT id, nome, sobrenome, email FROM usuario WHERE id = ?";
    
    $stmt_usuario = $conexao->prepare($sql_usuario);
    if (!$stmt_usuario) {
        throw new Exception('Erro ao preparar consulta do usuário: ' . $conexao->error);
    }
    
    $stmt_usuario->bind_param("i", $usuario_id);
    $stmt_usuario->execute();
    $resultado_usuario = $stmt_usuario->get_result();
    
    if ($resultado_usuario->num_rows === 0) {
        enviar_resposta(404, 'erro', 'Usuário não encontrado.');
    }
    
    $usuario = $resultado_usuario->fetch_assoc();
    
    // Tenta buscar foto_perfil separadamente
    $foto_perfil = null;
    try {
        $sql_foto = "SELECT foto_perfil FROM usuario WHERE id = ?";
        $stmt_foto = $conexao->prepare($sql_foto);
        $stmt_foto->bind_param("i", $usuario_id);
        $stmt_foto->execute();
        $resultado_foto = $stmt_foto->get_result();
        if ($resultado_foto->num_rows > 0) {
            $row_foto = $resultado_foto->fetch_assoc();
            $foto_perfil = $row_foto['foto_perfil'];
        }
    } catch (Exception $e) {
        $foto_perfil = null;
    }
    
    $usuario['foto_perfil'] = $foto_perfil;
    $usuario['data_criacao'] = date('Y-m-d H:i:s'); // Valor padrão
    
    // Busca estatísticas REAIS baseadas nos dispositivos do usuário
    $total_dispositivos = 0;
    $total_leituras = 0;
    
    // Verifica se as tabelas existem antes de consultar
    $sql_check_dispositivos = "SHOW TABLES LIKE 'dispositivos'";
    $resultado_check_disp = $conexao->query($sql_check_dispositivos);
    
    if ($resultado_check_disp && $resultado_check_disp->num_rows > 0) {
        // Busca dispositivos do usuário
        $sql_dispositivos = "SELECT COUNT(*) as total_dispositivos FROM dispositivos WHERE usuario_id = ?";
        $stmt_dispositivos = $conexao->prepare($sql_dispositivos);
        $stmt_dispositivos->bind_param("i", $usuario_id);
        $stmt_dispositivos->execute();
        $total_dispositivos = $stmt_dispositivos->get_result()->fetch_assoc()['total_dispositivos'];
        
        // Se o usuário tem dispositivos, busca as leituras
        if ($total_dispositivos > 0) {
            $sql_check_leituras = "SHOW TABLES LIKE 'leitura'";
            $resultado_check_leit = $conexao->query($sql_check_leituras);
            
            if ($resultado_check_leit && $resultado_check_leit->num_rows > 0) {
                // Conta leituras de TODOS os dispositivos do usuário
                $sql_leituras = "SELECT COUNT(l.id) as total_leituras 
                                 FROM leitura l 
                                 INNER JOIN dispositivos d ON l.dispositivo_id = d.id 
                                 WHERE d.usuario_id = ?";
                $stmt_leituras = $conexao->prepare($sql_leituras);
                $stmt_leituras->bind_param("i", $usuario_id);
                $stmt_leituras->execute();
                $total_leituras = $stmt_leituras->get_result()->fetch_assoc()['total_leituras'];
            }
        }
    }
    
    // Busca total de alertas (se a tabela existir)
    $total_alertas = 0;
    $sql_check_alertas = "SHOW TABLES LIKE 'alertas'";
    $resultado_check = $conexao->query($sql_check_alertas);
    
    if ($resultado_check && $resultado_check->num_rows > 0) {
        $sql_alertas = "SELECT COUNT(a.id) as total_alertas 
                        FROM alertas a 
                        WHERE a.usuario_id = ?";
        $stmt_alertas = $conexao->prepare($sql_alertas);
        $stmt_alertas->bind_param("i", $usuario_id);
        $stmt_alertas->execute();
        $total_alertas = $stmt_alertas->get_result()->fetch_assoc()['total_alertas'];
    } else {
        // Se não existir tabela de alertas, calcula baseado em leituras com valores críticos
        $sql_alertas_calc = "SELECT COUNT(l.id) as total_alertas 
                            FROM leitura l 
                            INNER JOIN dispositivos d ON l.dispositivo_id = d.id 
                            WHERE d.usuario_id = ? 
                            AND (l.ph < 6.0 OR l.ph > 9.0 
                                OR l.turbidez > 10 
                                OR l.condutividade > 2.5 
                                OR l.temperatura < 10 OR l.temperatura > 30)";
        $stmt_alertas_calc = $conexao->prepare($sql_alertas_calc);
        $stmt_alertas_calc->bind_param("i", $usuario_id);
        $stmt_alertas_calc->execute();
        $total_alertas = $stmt_alertas_calc->get_result()->fetch_assoc()['total_alertas'];
    }
    
    // Calcula tempo como membro (usando data atual como padrão)
    $data_criacao = new DateTime($usuario['data_criacao']);
    $agora = new DateTime();
    $diferenca = $agora->diff($data_criacao);
    
    $membro_desde = 'Membro recente'; // Valor padrão
    
    // Monta resposta
    $dados_resposta = [
        'usuario' => [
            'id' => intval($usuario['id']),
            'nome' => $usuario['nome'],
            'sobrenome' => $usuario['sobrenome'],
            'nome_completo' => trim($usuario['nome'] . ' ' . $usuario['sobrenome']),
            'email' => $usuario['email'],
            'telefone' => '+55 (11) 99999-9999', // Padrão fixo
            'foto_perfil' => $usuario['foto_perfil'],
            'data_criacao' => $usuario['data_criacao'],
            'membro_desde' => $membro_desde
        ],
        'estatisticas' => [
            'total_dispositivos' => intval($total_dispositivos),
            'total_analises' => intval($total_leituras),
            'total_alertas' => intval($total_alertas)
        ],
        'localizacao' => 'São Paulo, SP - Brasil', // Padrão, pode ser expandido futuramente
        'atualizado_em' => date('c')
    ];
    
    log_error('Estatísticas do usuário buscadas com sucesso (versão corrigida)', [
        'usuario_id' => $usuario_id,
        'total_dispositivos' => $total_dispositivos,
        'total_leituras' => $total_leituras,
        'total_alertas' => $total_alertas,
        'foto_perfil_encontrada' => $foto_perfil !== null
    ]);
    
    enviar_resposta(200, 'sucesso', 'Estatísticas obtidas com sucesso', $dados_resposta);
    
} catch (Exception $e) {
    log_error('Erro ao buscar estatísticas do usuário (versão corrigida)', [
        'erro' => $e->getMessage(),
        'usuario_id' => $usuario_id,
        'linha' => $e->getLine()
    ]);
    
    enviar_resposta(500, 'erro', 'Erro interno do servidor: ' . $e->getMessage());
}

$conexao->close();
?>