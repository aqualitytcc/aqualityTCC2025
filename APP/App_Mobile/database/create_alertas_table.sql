-- Criação da tabela de alertas
CREATE TABLE IF NOT EXISTS alertas (
    id INT(11) NOT NULL AUTO_INCREMENT,
    usuario_id INT(11) NOT NULL,
    dispositivo_id INT(11) NOT NULL,
    regra_id INT(11) DEFAULT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'qualidade_agua',
    nivel ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    valor_atual DECIMAL(10,2) DEFAULT NULL,
    valor_limite DECIMAL(10,2) DEFAULT NULL,
    lido TINYINT(1) NOT NULL DEFAULT 0,
    resolvido TINYINT(1) NOT NULL DEFAULT 0,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_resolucao TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_dispositivo (dispositivo_id),
    INDEX idx_regra (regra_id),
    INDEX idx_tipo (tipo),
    INDEX idx_nivel (nivel),
    INDEX idx_lido (lido),
    INDEX idx_resolvido (resolvido),
    INDEX idx_data_criacao (data_criacao),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id) ON DELETE CASCADE,
    FOREIGN KEY (regra_id) REFERENCES regras_alerta(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Adicionar coluna regra_id na tabela regras_alerta se não existir
ALTER TABLE regras_alerta 
ADD COLUMN IF NOT EXISTS regra_id INT(11) DEFAULT NULL AFTER id;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_regras_usuario ON regras_alerta(usuario_id);
CREATE INDEX IF NOT EXISTS idx_regras_dispositivo ON regras_alerta(dispositivo_id);
CREATE INDEX IF NOT EXISTS idx_regras_parametro ON regras_alerta(parametro);

-- Inserir dados de exemplo para testes (opcional)
INSERT IGNORE INTO regras_alerta (usuario_id, dispositivo_id, parametro, condicao, valor, data_criacao) VALUES
(1, 1, 'temperatura', 'maior_que', 30.0, NOW()),
(1, 1, 'ph', 'menor_que', 6.5, NOW()),
(1, 1, 'turbidez', 'maior_que', 5.0, NOW()),
(1, 1, 'condutividade', 'maior_que', 1000.0, NOW());
