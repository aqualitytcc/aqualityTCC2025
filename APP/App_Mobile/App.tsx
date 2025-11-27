// Importa a biblioteca principal do React para criar componentes funcionais
import React from 'react';
// Importa o container de navegação para gerenciar a navegação entre telas
import { NavigationContainer } from '@react-navigation/native';
// Importa o criador de navegação em pilha (Stack Navigator)
import { createStackNavigator } from '@react-navigation/stack';
// Importa o React Query para gerenciamento de cache e requisições assíncronas
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Importa o componente de StatusBar do Expo
import { StatusBar } from 'expo-status-bar';
// Importa componentes básicos do React Native
import { View, ActivityIndicator } from 'react-native';
// Importa o objeto de cores customizadas do projeto
import { colors } from './src/utils/colors';
// Importa o provider e hook do contexto de tema
import { ThemeProvider, useThemeMode } from './src/contexts/ThemeContext';

// Importa as páginas principais do fluxo de autenticação e navegação
import { Login } from './src/pages/Login';
import { Signup } from './src/pages/Signup';
import { MainTabs } from './src/navigation/MainTabs';
// Importa o provider e hook do contexto de autenticação
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
// Importa o serviço de notificações
import { notificationService } from './src/services/notificationService';

// Cria o objeto de navegação em pilha
const Stack = createStackNavigator();
// Instancia o cliente do React Query para cache e requisições
const queryClient = new QueryClient();

// Componente responsável por gerenciar a navegação de acordo com o estado de autenticação
const AppNavigator = () => {
  // Obtém o usuário autenticado e o estado de carregamento do contexto de autenticação
  const { user, isLoading } = useAuth();

  // Exibe um indicador de carregamento enquanto verifica o estado de autenticação
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.water.primary} />
      </View>
    );
  }

  // Define as rotas disponíveis de acordo com o estado do usuário
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Esconde o cabeçalho padrão
        cardStyle: { backgroundColor: colors.background }, // Define cor de fundo padrão
      }}
    >
      {user ? (
        // Se autenticado, mostra as abas principais
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        // Se não autenticado, mostra as telas de login e cadastro
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
        </>
      )}
    </Stack.Navigator>
  );
};

// Componente principal do app, responsável por envolver toda a aplicação com os providers globais
export default function App() {
  // Inicializar notificações quando o app carrega
  React.useEffect(() => {
    const initNotifications = async () => {
      try {
        await notificationService.initialize();
      } catch (error) {
        console.error('Erro ao inicializar notificações:', error);
      }
    };

    initNotifications();
  }, []);

  return (
    // Provider do React Query para gerenciamento de cache e requisições
    <QueryClientProvider client={queryClient}>
      {/* Provider de autenticação para controle de login/logout */}
      <AuthProvider>
        {/* Provider de tema para alternância entre temas claro/escuro */}
        <ThemeProvider>
          {/* Container de navegação para gerenciar as rotas */}
          <NavigationContainer>
            {/* StatusBar customizada conforme o tema */}
            <ThemedStatusBar />
            {/* Componente de navegação principal */}
            <AppNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Componente para customizar a StatusBar de acordo com o tema do app
const ThemedStatusBar: React.FC = () => {
  return (
    <View style={{ backgroundColor: colors.background }}>
      {/* Define o estilo da StatusBar, pode ser ajustado conforme o tema */}
      <StatusBar style="dark" />
    </View>
  );
};