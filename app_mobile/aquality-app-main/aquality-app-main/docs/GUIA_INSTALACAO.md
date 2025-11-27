# Guia de Configuração do Sistema Water Sense Mobile

## 📋 Índice
1. [Configuração do Banco de Dados](#1-configuração-do-banco-de-dados)
2. [Configuração do Backend (APIs PHP)](#2-configuração-do-backend-apis-php)
3. [Configuração do Aplicativo Mobile](#3-configuração-do-aplicativo-mobile)
4. [Configuração do ESP32 A-Quality](#4-configuração-do-esp32-a-quality)
5. [Testes e Validação](#5-testes-e-validação)
6. [Troubleshooting](#6-troubleshooting)

## 1. Configuração do Banco de Dados

### 1.1 Pré-requisitos
- MySQL 5.7+ ou MariaDB 10.3+
- Acesso administrativo ao banco de dados

### 1.2 Passos de Instalação

1. **Criar o banco de dados:**
```sql
CREATE DATABASE aquality_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Executar o script de schema:**
```bash
mysql -u root -p aquality_db < api_da_versaoWEBSITE/database_schema.sql
```

3. **Verificar a criação das tabelas:**
```sql
USE aquality_db;
SHOW TABLES;
```

Você deve ver as seguintes tabelas:
- `usuario`
- `dispositivos`
- `leituras_sensores`
- `alertas`
- `limites_parametros`
- `logs_atividades`

### 1.3 Inserir Usuário de Teste

```sql
INSERT INTO usuario (nome, sobrenome, email, senha) 
VALUES ('Admin', 'Sistema', 'admin@aquality.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
```

## 2. Configuração do Backend (APIs PHP)

### 2.1 Pré-requisitos
- PHP 7.4+ (recomendado 8.0+)
- Apache/Nginx com mod_rewrite
- Extensões PHP: mysqli, json, curl

### 2.2 Configuração do Ambiente

1. **Editar o arquivo config.php:**
```php
// api_da_versaoWEBSITE/config.php
define('DB_SERVIDOR', 'localhost');
define('DB_USUARIO', 'seu_usuario_db');
define('DB_SENHA', 'sua_senha_db');
define('DB_BANCO', 'aquality_db');
```

2. **Configurar permissões de diretório:**
```bash
chmod 755 api_da_versaoWEBSITE/
chmod 666 api_da_versaoWEBSITE/logs/
```

3. **Testar conexão com o banco:**
```bash
php -r "
require 'api_da_versaoWEBSITE/config.php';
$conn = conectar_banco();
echo $conn ? 'Conexão OK' : 'Erro na conexão';
"
```

### 2.3 Estrutura das APIs

```
api_da_versaoWEBSITE/
├── config.php                    # Configurações gerais
├── database_schema.sql           # Schema do banco
├── usuarios/
│   ├── login.php                # Login de usuários
│   └── registrar.php            # Cadastro de usuários
├── dispositivos/
│   └── gerenciar.php            # CRUD de dispositivos
├── sensores/
│   ├── receber_dados.php        # Receber dados do ESP32
│   └── buscar_dados.php         # Buscar dados para o app
└── alertas/
    └── gerenciar.php            # Gerenciar alertas
```

### 2.4 Testar APIs

**Teste de Login:**
```bash
curl -X POST http://localhost/water-sense-mobile/api_da_versaoWEBSITE/usuarios/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aquality.com","senha":"password"}'
```

**Teste de Recepção de Dados:**
```bash
curl -X POST http://localhost/water-sense-mobile/api_da_versaoWEBSITE/sensores/receber_dados.php \
  -H "Content-Type: application/json" \
  -d '{
    "codigo_dispositivo":"ESP32_001",
    "ph":7.2,
    "turbidez":5.5,
    "condutividade":1.8,
    "temperatura":22.5,
    "bateria":85,
    "sinal":75
  }'
```

## 3. Configuração do Aplicativo Mobile

### 3.1 Pré-requisitos
- Node.js 16+ 
- Expo CLI
- React Native development environment

### 3.2 Instalação

1. **Instalar dependências:**
```bash
cd water-sense-mobile
npm install
```

2. **Configurar URL da API:**
```typescript
// src/services/api.ts
const API_BASE_URL = 'http://SEU_DOMINIO.com/water-sense-mobile/api_da_versaoWEBSITE';
```

3. **Executar o app:**
```bash
# Desenvolvimento
npm start

# Android
npm run android

# iOS  
npm run ios

# Web
npm run web
```

### 3.3 Credenciais de Teste

- **Email:** admin@aquality.com
- **Senha:** password

### 3.4 Principais Funcionalidades

- ✅ Login/Cadastro de usuários
- ✅ Visualização de dispositivos
- ✅ Monitoramento em tempo real
- ✅ Histórico de leituras
- ✅ Sistema de alertas
- ✅ Gestão de dispositivos

## 4. Configuração do ESP32 A-Quality

### 4.1 Hardware Necessário

- ESP32 DevKit V1
- Sensor de pH (módulo analógico)
- Sensor de turbidez (módulo analógico)
- Sensor de condutividade (módulo analógico)
- Sensor de temperatura DS18B20
- LED de status
- Buzzer (opcional)
- Resistores pull-up (4.7kΩ para DS18B20)

### 4.2 Diagrama de Conexões

```
ESP32 DevKit V1:
├── GPIO 2  → DS18B20 (Temperatura)
├── GPIO A0 → Sensor pH
├── GPIO A1 → Sensor Turbidez  
├── GPIO A2 → Sensor Condutividade
├── GPIO 13 → LED Status
├── GPIO 12 → Buzzer
├── 3.3V    → Alimentação sensores
└── GND     → Ground comum
```

### 4.3 Instalação do Código

1. **Instalar bibliotecas no Arduino IDE:**
   - WiFi (ESP32)
   - HTTPClient (ESP32)
   - ArduinoJson (v6.x)
   - OneWire
   - DallasTemperature

2. **Configurar o código:**
```cpp
// esp32_aquality/aquality_sensor.ino
const char* ssid = "SUA_REDE_WIFI";
const char* password = "SUA_SENHA_WIFI";
const char* apiURL = "http://SEU_DOMINIO.com/water-sense-mobile/api_da_versaoWEBSITE/sensores/receber_dados.php";
const char* deviceCode = "ESP32_001"; // Código único
```

3. **Fazer upload para o ESP32**

### 4.4 Calibração dos Sensores

1. **pH:** Use soluções buffer pH 4.0, 7.0 e 10.0
2. **Turbidez:** Use água destilada (0 NTU) e padrões conhecidos
3. **Condutividade:** Use soluções padrão de condutividade
4. **Temperatura:** Verificar com termômetro calibrado

### 4.5 Monitoramento

- Monitor Serial do Arduino IDE para logs
- LEDs de status para verificar funcionamento
- Alertas sonoros para condições críticas

## 5. Testes e Validação

### 5.1 Teste de Fluxo Completo

1. **ESP32 → Backend:**
   - Verificar envio de dados no Serial Monitor
   - Confirmar recepção na tabela `leituras_sensores`

2. **Backend → Mobile:**
   - Login no app mobile
   - Visualizar dados em tempo real
   - Verificar histórico e alertas

3. **Alertas:**
   - Simular valores críticos no ESP32
   - Verificar geração de alertas no backend
   - Confirmar notificações no app

### 5.2 Testes de Performance

```bash
# Teste de carga na API
ab -n 100 -c 10 -H "Content-Type: application/json" \
   -p test_data.json \
   http://localhost/water-sense-mobile/api_da_versaoWEBSITE/sensores/receber_dados.php
```

### 5.3 Monitoramento de Logs

```bash
# Logs do Apache/Nginx
tail -f /var/log/apache2/error.log

# Logs da aplicação
tail -f api_da_versaoWEBSITE/logs/api.log
```

## 6. Troubleshooting

### 6.1 Problemas Comuns do Backend

**Erro de conexão com banco:**
```
Solução: Verificar credenciais em config.php
```

**CORS errors:**
```
Solução: Configurar cabeçalhos CORS no servidor web
```

**Timeout de requisições:**
```
Solução: Aumentar max_execution_time no php.ini
```

### 6.2 Problemas Comuns do Mobile

**Erro de rede:**
```
Solução: Verificar URL da API em src/services/api.ts
```

**Dados não carregam:**
```
Solução: Verificar console do navegador/device para erros
```

### 6.3 Problemas Comuns do ESP32

**WiFi não conecta:**
```
Solução: Verificar SSID e senha, signal strength
```

**Sensores retornam valores incorretos:**
```
Solução: Verificar conexões e calibrar sensores
```

**API retorna erro 404:**
```
Solução: Verificar URL da API e conectividade
```

### 6.4 Comandos Úteis de Debug

```bash
# Verificar status do MySQL
systemctl status mysql

# Verificar logs do PHP
tail -f /var/log/php_errors.log

# Testar conectividade
ping SEU_DOMINIO.com
curl -I http://SEU_DOMINIO.com/water-sense-mobile/api_da_versaoWEBSITE/

# Verificar portas
netstat -tlnp | grep :80
netstat -tlnp | grep :3306
```

## 7. Manutenção e Atualizações

### 7.1 Backup do Banco de Dados
```bash
mysqldump -u root -p water_sense_db > backup_$(date +%Y%m%d).sql
```

### 7.2 Monitoramento Contínuo
- Configurar alertas de sistema
- Monitorar uso de recursos
- Verificar logs regularmente

### 7.3 Atualizações de Segurança
- Manter PHP atualizado
- Atualizar dependências do Node.js
- Revisar credenciais regularmente

---

## 📞 Suporte

Para suporte técnico, consulte:
- Documentação completa no repositório
- Logs detalhados em `api_da_versaoWEBSITE/logs/`
- Issues no GitHub do projeto

**Equipe de Desenvolvimento:** Henzo, Fellipe, Matheus Henrique, Victor, Heitor, Erick Dionisio, Luiz Fernando, João Pedro