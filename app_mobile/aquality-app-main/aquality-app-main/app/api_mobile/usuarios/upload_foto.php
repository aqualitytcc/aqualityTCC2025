<?php
/**
 * API para Upload de Foto de Perfil - Water Sense Mobile
 * Permite fazer upload de imagens para foto de perfil
 */

require_once __DIR__ . '/../config.php';

// Configura CORS e headers
configurar_cors();

/**
 * Permite apenas método POST
 */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviar_resposta(405, 'erro', 'Método não permitido. Use POST.');
}

// Conecta ao banco de dados
$conexao = conectar_banco();
if (!$conexao) {
    enviar_resposta(500, 'erro', 'Falha na conexão com o banco de dados.');
}

$usuario_id = $_POST['usuario_id'] ?? null;

if (!$usuario_id) {
    enviar_resposta(400, 'erro', 'ID do usuário é obrigatório.');
}

// Verifica se foi enviado um arquivo
if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
    $error_message = 'Erro no upload da foto.';
    
    if (isset($_FILES['foto']['error'])) {
        switch ($_FILES['foto']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $error_message = 'Arquivo muito grande. Máximo permitido: 5MB.';
                break;
            case UPLOAD_ERR_PARTIAL:
                $error_message = 'Upload incompleto.';
                break;
            case UPLOAD_ERR_NO_FILE:
                $error_message = 'Nenhuma foto foi enviada.';
                break;
            default:
                $error_message = 'Erro desconhecido no upload.';
        }
    }
    
    enviar_resposta(400, 'erro', $error_message);
}

try {
    // Verifica se o usuário existe
    $sql_check = "SELECT id FROM usuario WHERE id = ?";
    $stmt_check = $conexao->prepare($sql_check);
    $stmt_check->bind_param("i", $usuario_id);
    $stmt_check->execute();
    
    if ($stmt_check->get_result()->num_rows === 0) {
        enviar_resposta(404, 'erro', 'Usuário não encontrado.');
    }
    
    $arquivo = $_FILES['foto'];
    
    // Validações do arquivo
    $tamanho_maximo = 5 * 1024 * 1024; // 5MB
    if ($arquivo['size'] > $tamanho_maximo) {
        enviar_resposta(400, 'erro', 'Arquivo muito grande. Máximo: 5MB.');
    }
    
    // Verifica o tipo MIME
    $tipos_permitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $tipo_arquivo = finfo_file($finfo, $arquivo['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($tipo_arquivo, $tipos_permitidos)) {
        enviar_resposta(400, 'erro', 'Tipo de arquivo não permitido. Use: JPG, PNG, GIF ou WebP.');
    }
    
    // Gera nome único para o arquivo
    $extensao = pathinfo($arquivo['name'], PATHINFO_EXTENSION);
    $nome_arquivo = 'perfil_' . $usuario_id . '_' . time() . '.' . $extensao;
    
    // Define diretório de upload
    $diretorio_upload = __DIR__ . '/../uploads/perfil/';
    
    // Cria diretório se não existir
    if (!is_dir($diretorio_upload)) {
        if (!mkdir($diretorio_upload, 0755, true)) {
            throw new Exception('Erro ao criar diretório de upload.');
        }
    }
    
    $caminho_completo = $diretorio_upload . $nome_arquivo;
    
    // Move o arquivo para o destino
    if (!move_uploaded_file($arquivo['tmp_name'], $caminho_completo)) {
        throw new Exception('Erro ao salvar arquivo.');
    }
    
    // Gera URL pública da foto
    $url_foto = '/app/api_mobile/uploads/perfil/' . $nome_arquivo;
    
    // Remove foto anterior se existir
    $sql_foto_anterior = "SELECT foto_perfil FROM usuario WHERE id = ?";
    $stmt_anterior = $conexao->prepare($sql_foto_anterior);
    $stmt_anterior->bind_param("i", $usuario_id);
    $stmt_anterior->execute();
    $foto_anterior = $stmt_anterior->get_result()->fetch_assoc()['foto_perfil'];
    
    if ($foto_anterior && strpos($foto_anterior, '/app/api_mobile/uploads/perfil/') === 0) {
        $arquivo_anterior = __DIR__ . '/../uploads/perfil/' . basename($foto_anterior);
        if (file_exists($arquivo_anterior)) {
            unlink($arquivo_anterior);
        }
    }
    
    // Atualiza no banco de dados
    $sql_update = "UPDATE usuario SET foto_perfil = ? WHERE id = ?";
    $stmt_update = $conexao->prepare($sql_update);
    
    if (!$stmt_update) {
        throw new Exception('Erro ao preparar atualização: ' . $conexao->error);
    }
    
    $stmt_update->bind_param("si", $url_foto, $usuario_id);
    
    if ($stmt_update->execute()) {
        $dados_resposta = [
            'foto_perfil' => $url_foto,
            'url_completa' => 'http://tcc3eetecgrupo5t1.hospedagemdesites.ws' . $url_foto,
            'nome_arquivo' => $nome_arquivo
        ];
        
        log_error('Foto de perfil atualizada com sucesso', [
            'usuario_id' => $usuario_id,
            'arquivo' => $nome_arquivo,
            'tamanho' => $arquivo['size']
        ]);
        
        enviar_resposta(200, 'sucesso', 'Foto de perfil atualizada com sucesso', $dados_resposta);
        
    } else {
        // Remove arquivo se falhou ao salvar no banco
        if (file_exists($caminho_completo)) {
            unlink($caminho_completo);
        }
        throw new Exception('Erro ao atualizar foto no banco de dados: ' . $stmt_update->error);
    }
    
} catch (Exception $e) {
    // Remove arquivo em caso de erro
    if (isset($caminho_completo) && file_exists($caminho_completo)) {
        unlink($caminho_completo);
    }
    
    log_error('Erro no upload da foto de perfil', [
        'erro' => $e->getMessage(),
        'usuario_id' => $usuario_id,
        'arquivo_info' => $_FILES['foto'] ?? null
    ]);
    
    enviar_resposta(500, 'erro', 'Erro interno do servidor');
}

$conexao->close();
?>