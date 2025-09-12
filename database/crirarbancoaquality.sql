use aquality;
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  senha_hash VARCHAR(255),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE dispositivos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT,
  nome VARCHAR(100),
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE TABLE leituras (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dispositivo_id INT,
  temperatura DECIMAL(5,2),
  tds INT,
  ph DECIMAL(4,2),
  turbidez DECIMAL(5,2),
  data_leitura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
);
