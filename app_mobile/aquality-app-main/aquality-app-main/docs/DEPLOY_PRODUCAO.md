# 🚀 Guia de Deploy - Aquality

## 📋 Informações do Ambiente de Produção

**🌐 Hospedagem:**
- **Host FTP:** ftp.tcc3eetecgrupo5.tecnologia.ws
- **Usuário FTP:** tcc3eetecgrupo5t1
- **Senha FTP:** Tcc3eetecgrupo5t1@123
- **Porta:** 21
- **URL do Site:** https://tcc3eetecgrupo5t1.hospedagemdesites.ws

**🗄️ Banco de Dados:**
- **Servidor:** aquality_db.mysql.dbaas.com.br
- **Usuário:** aquality_db
- **Senha:** ROSA123456a#
- **Nome do Banco:** aquality_db
- **Estrutura:** Já existe com tabelas usuario, dispositivos, leitura

## 📁 Estrutura de Arquivos para Upload

Faça upload dos seguintes arquivos via FTP para o diretório `/app/api_mobile/`:

```
/app/api_mobile/
├── config.php                           # ✅ Configuração principal
├── usuarios/
│   ├── login.php                        # ✅ API de login
│   └── cadastro.php                     # ✅ API de cadastro
├── dispositivos/
│   └── gerenciar.php                    # ✅ CRUD de dispositivos
├── sensores/
│   ├── receber_dados.php               # ✅ Receber dados do ESP32
│   └── buscar_dados.php                # ✅ Buscar dados para o app
└── logs/
    └── (diretório será criado automaticamente)
```

## 🔧 Configuração Passo a Passo

### 1. **Fazer Upload dos Arquivos**
Use um cliente FTP (FileZilla, WinSCP, etc.) para enviar os arquivos:

1. Conecte-se ao FTP:
   - Host: `ftp.tcc3eetecgrupo5.tecnologia.ws`
   - Usuário: `tcc3eetecgrupo5t1`
   - Senha: `Tcc3eetecgrupo5t1@123`
   - Porta: 21

2. Navegue até o diretório `/app/` e crie a pasta `api_mobile`

3. Faça upload de todos os arquivos PHP mantendo a estrutura de pastas

### 2. **Credenciais Já Configuradas ✅**
As credenciais do banco de dados já estão configuradas corretamente no `config.php`:
- ✅ Servidor: aquality_db.mysql.dbaas.com.br
- ✅ Usuário: aquality_db
- ✅ Senha: ROSA123456a#
- ✅ Banco: aquality_db

### 3. **Configurar Permissões**
Certifique-se de que as pastas tenham as permissões corretas:
- **📁 Pastas:** 755
- **📄 Arquivos PHP:** 644
- **📝 Pasta logs:** 777 (para escrita de logs)

### 4. **Testar as APIs**
Execute o script de teste para validar a instalação:

```bash
php teste_producao.php
```

Ou acesse diretamente no navegador:
```
https://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/usuarios/login.php
```

## 📱 Configuração do App Mobile

No arquivo `src/services/api.ts`, a URL já está configurada para produção:
```typescript
const API_BASE_URL = 'https://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile';
```

## 🔧 Configuração do ESP32

No código Arduino, configure:
```cpp
const char* apiURL = "https://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/sensores/receber_dados.php";
```

## 🧪 Testando o Sistema Completo

### Teste 1: Cadastro via App Mobile
1. Abra o app mobile
2. Clique em "Cadastre-se aqui" na tela de login
3. Preencha os dados e clique em "Criar Conta"
4. Verifique se o login automático funciona

### Teste 2: Envio de Dados do ESP32
Use este comando curl para simular o ESP32:
```bash
curl -X POST https://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/sensores/receber_dados.php \
  -H "Content-Type: application/json" \
  -d '{
    "codigo_dispositivo": "ESP32_TESTE_001",
    "ph": 7.2,
    "turbidez": 5.5,
    "condutividade": 1.8,
    "temperatura": 22.5
  }'
```

### Teste 3: Visualização no App
1. Faça login no app
2. Verifique se os dados aparecem no dashboard
3. Navegue para "Dispositivos" e veja a lista
4. Verifique o histórico de leituras

## 📊 Monitoramento e Logs

### Visualizar Logs da API
Acesse: `https://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/logs/api.log`

### Verificar Status do Banco
As próprias APIs fazem log das conexões. Verifique os logs para diagnóstico.

### Estrutura dos Logs
```
[2025-09-18 14:30:25] Conexão com banco estabelecida com sucesso | Context: {"servidor":"aquality_db.mysql.dbaas.com.br","banco":"aquality_db","timestamp":"2025-09-18 14:30:25"}
[2025-09-18 14:30:26] Login realizado com sucesso | Context: {"usuario_id":"1","email":"teste@aquality.com","ip":"192.168.1.100"}
```

## 🛠️ Resolução de Problemas Comuns

### ❌ Erro de Conexão com Banco
**Sintomas:** APIs retornam erro 500
**Solução:** 
1. Verifique as credenciais em `config.php`
2. Confirme se o servidor do banco está acessível
3. Verifique os logs de erro

### ❌ Erro 404 nas APIs
**Sintomas:** App não consegue fazer requisições
**Solução:**
1. Verifique se os arquivos foram enviados para `/app/api_mobile/`
2. Confirme se a URL no app está correta
3. Teste acessando as URLs diretamente no navegador

### ❌ CORS Errors
**Sintomas:** Erro de CORS no app mobile
**Solução:**
1. Verifique se a função `configurar_cors()` está sendo chamada
2. Confirme se o servidor permite requisições cross-origin

### ❌ ESP32 não consegue enviar dados
**Sintomas:** Sensor não aparece como online
**Solução:**
1. Verifique a URL no código do ESP32
2. Confirme se o dispositivo foi cadastrado primeiro
3. Verifique os logs do Serial Monitor

## 📋 Checklist de Deploy

- [ ] ✅ Arquivos PHP enviados via FTP
- [ ] ✅ Credenciais do banco configuradas
- [ ] ✅ Permissões de arquivo ajustadas
- [ ] ✅ APIs testadas com script de teste
- [ ] ✅ App mobile compilado com URL de produção
- [ ] ✅ ESP32 configurado com URL de produção
- [ ] ✅ Teste end-to-end realizado
- [ ] ✅ Logs funcionando corretamente

## 🎯 URLs Importantes

- **🌐 Site Principal:** https://tcc3eetecgrupo5t1.hospedagemdesites.ws
- **🔐 API de Login:** https://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/usuarios/login.php
- **📱 API de Cadastro:** https://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/usuarios/cadastro.php
- **🌡️ API do ESP32:** https://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/sensores/receber_dados.php
- **📊 API de Dados:** https://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/sensores/buscar_dados.php
- **📋 Logs:** https://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/logs/api.log

## 🎉 Pronto para Uso!

Após seguir todos os passos, seu sistema Water Sense estará completamente funcional:

- ✅ **Backend:** APIs rodando no servidor remoto
- ✅ **Mobile App:** Conectado às APIs reais
- ✅ **ESP32:** Pronto para enviar dados dos sensores
- ✅ **Banco de Dados:** Armazenando dados em produção
- ✅ **Monitoramento:** Logs detalhados para debugging

---

**👥 Equipe de Desenvolvimento:** Henzo, Fellipe, Matheus Henrique, Victor, Heitor, Erick Dionisio, Luiz Fernando, João Pedro

**📅 Versão:** 1.0.0 - Produção