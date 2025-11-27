-- Script para criar regras de alerta de exemplo
-- Execute este script no banco de dados para testar o sistema de alertas

-- Inserir regras de alerta para o usuário 1 e dispositivo 1
INSERT IGNORE INTO regras_alerta (usuario_id, dispositivo_id, parametro, condicao, valor, data_criacao) VALUES
-- Regra para temperatura alta
(1, 1, 'temperatura', 'maior_que', 30.0, NOW()),

-- Regra para pH baixo
(1, 1, 'ph', 'menor_que', 6.5, NOW()),

-- Regra para turbidez alta
(1, 1, 'turbidez', 'maior_que', 5.0, NOW()),

-- Regra para condutividade alta
(1, 1, 'condutividade', 'maior_que', 2.0, NOW());

-- Verificar se as regras foram inseridas
SELECT * FROM regras_alerta WHERE usuario_id = 1 AND dispositivo_id = 1;
