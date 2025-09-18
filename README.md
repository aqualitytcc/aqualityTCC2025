# Water Sense Mobile - React Native

Aplicativo móvel para monitoramento da qualidade da água, convertido do projeto React Web original.

## 🚀 Tecnologias Utilizadas

- **React Native** com **Expo**
- **TypeScript**
- **React Navigation** (Stack + Bottom Tabs)
- **React Query** para gerenciamento de estado
- **Lucide React Native** para ícones
- **React Hook Form** para formulários

## 📱 Funcionalidades

- **Dashboard Principal**: Visualização em tempo real dos dados de qualidade da água
- **Análises**: Cards com métricas de PH, Turbidez, Condutividade e Temperatura
- **Dispositivos**: Gerenciamento de sensores conectados
- **Configurações**: Preferências do usuário e configurações do app
- **Perfil**: Informações do usuário e estatísticas
- **Navegação**: Sistema de navegação por abas otimizado para mobile

## 🎨 Design System

O app mantém o mesmo sistema de cores e design do projeto web original:

- **Cores Principais**: Azul aquático (#3B82F6) com gradientes
- **Status Colors**: Verde (sucesso), Amarelo (aviso), Vermelho (perigo)
- **Tipografia**: Sistema de tamanhos e pesos consistentes
- **Componentes**: Cards, botões e elementos visuais responsivos

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── MobileHeader.tsx
│   ├── AnalysisCard.tsx
│   ├── LocationCard.tsx
│   ├── QuickActionsGrid.tsx
│   ├── DeviceSwitchCard.tsx
│   └── BottomNavigation.tsx
├── pages/              # Páginas da aplicação
│   ├── Home.tsx
│   ├── Devices.tsx
│   ├── Settings.tsx
│   ├── Login.tsx
│   ├── Profile.tsx
│   ├── Records.tsx
│   ├── Maps.tsx
│   └── Notifications.tsx
├── navigation/         # Configuração de navegação
│   └── MainTabs.tsx
├── hooks/             # Hooks customizados
│   └── useToast.ts
├── utils/             # Utilitários e constantes
│   └── colors.ts
├── types/             # Definições de tipos TypeScript
│   └── index.ts
└── assets/            # Imagens e recursos
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Expo CLI (`npm install -g @expo/cli`)

### Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Execute o projeto:
   ```bash
   # Para web
   npm run web
   
   # Para Android
   npm run android
   
   # Para iOS (apenas no macOS)
   npm run ios
   ```

## 📱 Plataformas Suportadas

- **Android**: Suporte completo
- **iOS**: Suporte completo
- **Web**: Suporte para desenvolvimento e preview

## 🔧 Configurações

### Cores e Temas

As cores estão definidas em `src/utils/colors.ts` e seguem o mesmo padrão do projeto web:

```typescript
export const colors = {
  water: {
    primary: '#3B82F6',
    secondary: '#DBEAFE',
    accent: '#0EA5E9',
  },
  // ... outras cores
};
```

### Navegação

O app usa React Navigation com:
- **Stack Navigator** para navegação principal
- **Bottom Tab Navigator** para as abas principais
- **Navegação programática** para ações específicas

## 📦 Dependências Principais

- `@react-navigation/native`: Navegação
- `@react-navigation/bottom-tabs`: Navegação por abas
- `@tanstack/react-query`: Gerenciamento de estado
- `lucide-react-native`: Ícones
- `react-hook-form`: Formulários
- `expo`: Plataforma de desenvolvimento

## 🎯 Próximos Passos

- [ ] Implementar funcionalidades de autenticação
- [ ] Adicionar gráficos e visualizações de dados
- [ ] Implementar notificações push
- [ ] Adicionar sincronização offline
- [ ] Implementar testes unitários
- [ ] Adicionar animações e transições

## 📄 Licença

Este projeto é uma conversão do projeto React Web original mantendo a mesma funcionalidade e design.
