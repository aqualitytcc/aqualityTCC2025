-- Script SQL para adicionar suporte a fotos de perfil
-- Water Sense Mobile - Atualização da estrutura do banco

-- 1. Adicionar coluna foto_perfil na tabela usuario
ALTER TABLE usuario 
ADD COLUMN foto_perfil VARCHAR(500) NULL COMMENT 'URL da foto de perfil do usuário';

-- 2. Criar índice para otimizar consultas
CREATE INDEX idx_usuario_foto ON usuario(foto_perfil);

-- 3. Verificar estrutura atualizada
DESCRIBE usuario;

-- 4. Teste de inserção (exemplo)
-- UPDATE usuario SET foto_perfil = '/app/api_mobile/uploads/perfil/perfil_1_1234567890.jpg' WHERE id = 1;

SELECT 'Estrutura do banco atualizada com sucesso!' as status;