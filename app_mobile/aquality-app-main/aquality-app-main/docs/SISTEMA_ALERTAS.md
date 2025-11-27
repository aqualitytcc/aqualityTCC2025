# Sistema de Alertas e Notificações - Aquality Mobile

## Visão Geral

O sistema de alertas do Aquality Mobile permite configurar regras automáticas para monitorar a qualidade da água e receber notificações push quando os parâmetros saem dos limites configurados.

## Funcionalidades Implementadas

### 1. APIs de Gerenciamento de Alertas

#### `/app/api_mobile/alertas/gerenciar.php`
- **GET**: Lista alertas do usuário
- **PUT**: Atualiza status do alerta (lido/resolvido)
- **POST**: Marca todos os alertas como lidos

#### `/app/api_mobile/alertas/regras.php`
- **GET**: Lista regras de alerta
- **POST**: Cria nova regra
- **PUT**: Atualiza regra existente
- **DELETE**: Remove regra

#### `/app/api_mobile/alertas/processar.php`
- **POST**: Processa alertas para uma nova leitura

### 2. Estrutura do Banco de Dados

#### Tabela `alertas`
```sql
CREATE TABLE alertas (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT(11) NOT NULL,
    dispositivo_id INT(11) NOT NULL,
    regra_id INT(11) DEFAULT NULL,
    tipo VARCHAR(50) DEFAULT 'qualidade_agua',
    nivel ENUM('info', 'warning', 'critical') DEFAULT 'info',
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    valor_atual DECIMAL(10,2) DEFAULT NULL,
    valor_limite DECIMAL(10,2) DEFAULT NULL,
    lido TINYINT(1) DEFAULT 0,
    resolvido TINYINT(1) DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_resolucao TIMESTAMP NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id),
    FOREIGN KEY (regra_id) REFERENCES regras_alerta(id)
);
```

#### Tabela `regras_alerta` (já existente)
- Configura regras personalizadas para cada usuário e dispositivo
- Suporta diferentes parâmetros: temperatura, pH, turbidez, condutividade
- Suporta diferentes condições: maior que, menor que, igual a, diferente de

### 3. Interface do Usuário

#### Página de Notificações (`/src/pages/Notifications.tsx`)
- Lista todos os alertas recebidos
- Mostra estatísticas (total, não lidos, não resolvidos)
- Permite marcar alertas como lidos
- Interface responsiva com pull-to-refresh

#### Página de Regras de Alerta (`/src/pages/AlertRules.tsx`)
- Criar, editar e remover regras de alerta
- Configurar parâmetros e limites
- Visualizar regras existentes

### 4. Sistema de Notificações Push

#### Serviço de Notificações (`/src/services/notificationService.ts`)
- Integração com Expo Notifications
- Notificações locais para alertas
- Gerenciamento de badges
- Configuração automática de permissões

#### Hook `useNotifications`
```typescript
const { isInitialized, badgeCount, sendAlert, clearBadge } = useNotifications();
```

### 5. Processamento Automático

#### Integração com Leituras de Sensores
- Quando uma nova leitura é recebida via `/app/api_mobile/sensores/receber_dados.php`
- O sistema automaticamente verifica todas as regras ativas
- Gera alertas quando condições são atendidas
- Envia notificações push para o usuário

## Como Usar

### 1. Configurar Regras de Alerta

1. Acesse **Configurações > Regras de Alerta**
2. Clique em **Nova Regra**
3. Selecione o dispositivo
4. Escolha o parâmetro (temperatura, pH, turbidez, condutividade)
5. Defina a condição (maior que, menor que, etc.)
6. Configure o valor limite
7. Salve a regra

### 2. Visualizar Alertas

1. Acesse **Configurações > Notificações**
2. Veja todos os alertas recebidos
3. Toque em um alerta para marcá-lo como lido
4. Use "Marcar todos como lidos" para limpar a lista

### 3. Receber Notificações Push

- As notificações são enviadas automaticamente quando alertas são gerados
- O app solicita permissões na primeira execução
- As notificações aparecem mesmo com o app fechado

## Parâmetros Suportados

| Parâmetro | Unidade | Descrição |
|-----------|---------|-----------|
| Temperatura | °C | Temperatura da água |
| pH | - | Nível de acidez (0-14) |
| Turbidez | NTU | Clareza da água |
| Condutividade | μS/cm | Capacidade de conduzir corrente elétrica |

## Condições Suportadas

| Condição | Símbolo | Descrição |
|----------|---------|-----------|
| Maior que | > | Valor maior que o limite |
| Menor que | < | Valor menor que o limite |
| Igual a | = | Valor igual ao limite |
| Diferente de | ≠ | Valor diferente do limite |

## Níveis de Alerta

- **Info**: Diferença menor que 20% do limite
- **Warning**: Diferença entre 20% e 50% do limite
- **Critical**: Diferença maior que 50% do limite

## Configuração do Banco de Dados

Execute o script SQL para criar a tabela de alertas:

```bash
mysql -u seu_usuario -p seu_banco < database/create_alertas_table.sql
```

## Dependências

### React Native
- `expo-notifications`: Para notificações push
- `@react-native-async-storage/async-storage`: Para armazenamento local

### Instalação
```bash
npm install expo-notifications
```

## Exemplo de Uso

### Criar uma regra de alerta
```typescript
const novaRegra = await regraAlertaService.criarRegra({
  usuario_id: 1,
  dispositivo_id: 1,
  parametro: 'temperatura',
  condicao: 'maior_que',
  valor: 30.0
});
```

### Enviar notificação de alerta
```typescript
await notificationService.sendAlertNotification({
  titulo: 'Alerta de Temperatura',
  mensagem: 'Temperatura acima do normal detectada',
  nivel: 'warning',
  dispositivo: 'Aquality01'
});
```

## Troubleshooting

### Notificações não funcionam
1. Verifique se as permissões foram concedidas
2. Confirme se o serviço está inicializado
3. Teste com notificações locais primeiro

### Alertas não são gerados
1. Verifique se as regras estão configuradas corretamente
2. Confirme se o dispositivo está enviando dados
3. Verifique os logs do servidor

### Problemas de performance
1. Limite o número de regras por dispositivo
2. Configure intervalos adequados entre verificações
3. Monitore o uso de recursos do servidor

## Próximos Passos

1. **Integração com Firebase**: Para notificações push em produção
2. **Alertas por email**: Notificações via email
3. **Dashboard de alertas**: Interface web para gerenciamento
4. **Histórico de alertas**: Relatórios e análises
5. **Alertas inteligentes**: Machine learning para detecção de padrões
