import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MobileHeader } from '../components/MobileHeader';
import { AnalysisCard } from '../components/AnalysisCard';
import { LocationCard } from '../components/LocationCard';
import { QuickActionsGrid } from '../components/QuickActionsGrid';
import { DeviceSwitchCard } from '../components/DeviceSwitchCard';
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator';
import { useToast } from '../hooks/useToast';
import { colors, typography, spacing } from '../utils/colors';
import { useThemeMode } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { deviceService } from '../services/deviceService';
import { Dispositivo, AnalysisItem } from '../types';
import { handleApiError } from '../services/api';

const { width } = Dimensions.get('window');

export const Home: React.FC = () => {
  const navigation = useNavigation();
  const { mode } = useThemeMode();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const pullProgress = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  const carregarDados = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🏠 Carregando dados do dashboard para usuário:', user.id);
      setHasError(false);
      setErrorMessage('');
      
      const response = await deviceService.buscarDispositivosComLeituras(user.id);
      console.log('🏠 Resposta da API:', response);
      
      if (response.status === 'sucesso' && Array.isArray(response.dados)) {
        console.log('🏠 Processando', response.dados.length, 'dispositivos');
        
        const dispositivosProcessados: Dispositivo[] = response.dados.map((dispositivo: any, index: number) => {
          try {
            console.log(`🏠 Processando dispositivo ${index + 1}:`, dispositivo);
            
            // Usa o status que vem da API (já calculado corretamente)
            const statusCalculado = dispositivo?.status || 'offline';
            
            // Cria um objeto básico com valores padrão seguros
            const dispositivoSeguro: Dispositivo = {
              id: dispositivo?.id || index + 1,
              nome: dispositivo?.nome || `Dispositivo ${index + 1}`,
              codigo_dispositivo: dispositivo?.codigo_dispositivo || '',
              localizacao: dispositivo?.localizacao || 'Localização não informada',
              descricao: '',
              coordenadas: {
                latitude: 0,
                longitude: 0
              },
              status: statusCalculado,
              nivel_bateria: 94, // Valor fixo ilustrativo
              versao_firmware: '1.0',
              leitura_atual: undefined,
              estatisticas: {
                total_leituras: dispositivo?.estatisticas?.total_leituras || 0,
                ultima_leitura: dispositivo?.estatisticas?.ultima_leitura,
                tempo_offline: '0 min'
              },
              datas: {
                criacao: dispositivo?.datas?.criacao || new Date().toISOString(),
                atualizacao: dispositivo?.datas?.atualizacao || new Date().toISOString(),
                ultima_comunicacao: dispositivo?.estatisticas?.ultima_leitura
              }
            };
            
            // Processa a leitura atual se existir
            if (dispositivo?.leitura_atual) {
              const leitura = dispositivo.leitura_atual;
              console.log('🔍 Processando leitura:', leitura);
              
              const processarValor = (valor: any) => {
                if (valor === null || valor === undefined || valor === '') return null;
                const num = Number(valor);
                return isNaN(num) ? null : num;
              };
              
              dispositivoSeguro.leitura_atual = {
                ph: {
                  valor: processarValor(leitura.ph?.valor),
                  status: leitura.ph?.status || 'unknown',
                  unidade: leitura.ph?.unidade || ''
                },
                turbidez: {
                  valor: processarValor(leitura.turbidez?.valor),
                  status: leitura.turbidez?.status || 'unknown',
                  unidade: leitura.turbidez?.unidade || '%'
                },
                condutividade: {
                  valor: processarValor(leitura.condutividade?.valor),
                  status: leitura.condutividade?.status || 'unknown',
                  unidade: leitura.condutividade?.unidade || ''
                },
                temperatura: {
                  valor: processarValor(leitura.temperatura?.valor),
                  status: leitura.temperatura?.status || 'unknown',
                  unidade: leitura.temperatura?.unidade || '°C'
                },
                timestamp: leitura.timestamp || new Date().toISOString(),
                qualidade_sinal: 100
              };
              
              console.log('✅ Leitura processada:', dispositivoSeguro.leitura_atual);
            }
            
            return dispositivoSeguro;
          } catch (deviceError) {
            console.error(`❌ Erro ao processar dispositivo ${index}:`, deviceError);
            // Retorna um dispositivo padrão em caso de erro
            return {
              id: index + 1,
              nome: `Dispositivo ${index + 1}`,
              codigo_dispositivo: '',
              localizacao: 'Localização não informada',
              descricao: '',
              coordenadas: { latitude: 0, longitude: 0 },
              status: 'offline' as const,
              nivel_bateria: 94, // Valor fixo ilustrativo
              versao_firmware: '1.0',
              leitura_atual: undefined,
              estatisticas: {
                total_leituras: 0,
                ultima_leitura: undefined,
                tempo_offline: '0 min'
              },
              datas: {
                criacao: new Date().toISOString(),
                atualizacao: new Date().toISOString(),
                ultima_comunicacao: undefined
              }
            };
          }
        });
        
        console.log('🏠 Dispositivos processados com sucesso:', dispositivosProcessados.length);
        setDispositivos(dispositivosProcessados);
      } else {
        console.warn('⚠️ Nenhum dispositivo encontrado ou resposta inválida');
        setDispositivos([]);
      }
    } catch (error) {
      console.error('❌ Erro crítico ao carregar dados:', error);
      setHasError(true);
      setErrorMessage('Erro ao carregar dados. Tente novamente.');
      setDispositivos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await carregarDados();
    setIsRefreshing(false);
  };

  // Função segura para obter dados de análise
  const getAnalysisData = (): AnalysisItem[] => {
    try {
      const dispositivoPrincipal = dispositivos.find(d => d.status === 'online') || dispositivos[0];
      
      if (!dispositivoPrincipal?.leitura_atual) {
        return [
          { label: "PH", value: "--", change: "Sem dados", trend: "up" as const, status: "normal" as const },
          { label: "Turbidez", value: "-- NTU", change: "Sem dados", trend: "up" as const, status: "normal" as const },
          { label: "Condutividade", value: "--", change: "Sem dados", trend: "up" as const, status: "normal" as const },
          { label: "Temperatura", value: "--°C", change: "Sem dados", trend: "up" as const, status: "normal" as const },
        ];
      }

      const leitura = dispositivoPrincipal.leitura_atual;
      
      return [
        {
          label: "PH",
          value: (leitura.ph?.valor != null) ? leitura.ph.valor.toFixed(1) : "--",
          change: getChangeText(leitura.ph?.status || 'normal'),
          trend: (leitura.ph?.status === 'danger') ? "down" as const : "up" as const,
          status: (leitura.ph?.status as 'normal' | 'warning' | 'danger') || 'normal',
        },
        {
          label: "Turbidez",
          value: (leitura.turbidez?.valor != null) ? `${leitura.turbidez.valor} ${leitura.turbidez.unidade || 'NTU'}` : "-- NTU",
          change: getChangeText(leitura.turbidez?.status || 'normal'),
          trend: (leitura.turbidez?.status === 'danger') ? "up" as const : "down" as const,
          status: (leitura.turbidez?.status as 'normal' | 'warning' | 'danger') || 'normal',
        },
        {
          label: "Condutividade",
          value: (leitura.condutividade?.valor != null) ? leitura.condutividade.valor.toFixed(2) : "--",
          change: getChangeText(leitura.condutividade?.status || 'normal'),
          trend: (leitura.condutividade?.status === 'danger') ? "up" as const : "down" as const,
          status: (leitura.condutividade?.status as 'normal' | 'warning' | 'danger') || 'normal',
        },
        {
          label: "Temperatura",
          value: (leitura.temperatura?.valor != null) ? `${leitura.temperatura.valor}${leitura.temperatura.unidade || '°C'}` : "--°C",
          change: getChangeText(leitura.temperatura?.status || 'normal'),
          trend: (leitura.temperatura?.status === 'danger') ? "up" as const : "down" as const,
          status: (leitura.temperatura?.status as 'normal' | 'warning' | 'danger') || 'normal',
        },
      ];
    } catch (error) {
      console.error('❌ Erro ao obter dados de análise:', error);
      return [
        { label: "PH", value: "--", change: "Erro", trend: "up" as const, status: "normal" as const },
        { label: "Turbidez", value: "--", change: "Erro", trend: "up" as const, status: "normal" as const },
        { label: "Condutividade", value: "--", change: "Erro", trend: "up" as const, status: "normal" as const },
        { label: "Temperatura", value: "--°C", change: "Erro", trend: "up" as const, status: "normal" as const },
      ];
    }
  };

  const getChangeText = (status: string): string => {
    try {
      switch (status) {
        case 'danger': return 'Crítico!';
        case 'warning': return 'Atenção';
        case 'normal': return 'Normal';
        case 'unknown': return 'Sem leitura';
        default: return 'Sem dados';
      }
    } catch (error) {
      console.error('❌ Erro ao obter texto de mudança:', error);
      return 'Erro';
    }
  };

  // Função segura para obter dados dos dispositivos
  const getDevicesData = () => {
    try {
      return dispositivos.map(dispositivo => ({
        name: dispositivo.nome || 'Dispositivo',
        active: dispositivo.status === 'online'
      }));
    } catch (error) {
      console.error('❌ Erro ao obter dados dos dispositivos:', error);
      return [];
    }
  };

  const getLastUpdateText = (): string => {
    try {
      const dispositivoPrincipal = dispositivos.find(d => d.status === 'online') || dispositivos[0];
      
      if (!dispositivoPrincipal?.leitura_atual?.timestamp) {
        return 'Nunca atualizado';
      }

      const timestamp = new Date(dispositivoPrincipal.leitura_atual.timestamp);
      const agora = new Date();
      const diferencaMs = agora.getTime() - timestamp.getTime();
      const diferencaMin = Math.floor(diferencaMs / (1000 * 60));
      
      if (diferencaMin < 1) {
        return 'Atualizado agora';
      } else if (diferencaMin < 60) {
        return `Atualizado há ${diferencaMin} minutos`;
      } else if (diferencaMin < 1440) { // menos de 24h
        const horas = Math.floor(diferencaMin / 60);
        return `Atualizado há ${horas} horas`;
      } else {
        const dias = Math.floor(diferencaMin / 1440);
        return `Atualizado há ${dias} dias`;
      }
    } catch (error) {
      console.error('❌ Erro ao obter texto de última atualização:', error);
      return 'Erro ao obter horário';
    }
  };

  const handleDeviceSwitch = () => {
    try {
      toast({
        title: "Dispositivos",
        description: "Abrindo seleção de dispositivos...",
      });
      navigation.navigate('Devices' as never);
    } catch (error) {
      console.error('❌ Erro ao navegar para dispositivos:', error);
    }
  };

  const handleActionPress = (action: string) => {
    try {
      // Navegação para a rota especificada
      navigation.navigate(action as never);
    } catch (error) {
      console.error('❌ Erro ao navegar para ação:', action, error);
    }
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 120, // Space for header
      paddingBottom: 100, // Space for bottom navigation
      paddingHorizontal: spacing.md,
    },
    content: {
      maxWidth: width,
      alignSelf: 'center',
    },
    title: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      marginBottom: spacing.md,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },
    loadingText: {
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    errorContainer: {
      padding: spacing.lg,
      margin: spacing.md,
      backgroundColor: colors.destructive,
      borderRadius: 8,
    },
    errorText: {
      color: colors.destructiveForeground,
      textAlign: 'center',
      fontSize: typography.sizes.md,
    },
  }), [mode]);

  // Tela de carregamento
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Carregando dados do dashboard...</Text>
      </View>
    );
  }

  // Tela de erro
  if (hasError) {
    return (
      <View style={styles.container}>
        <MobileHeader userName={user?.name || 'Usuário'} />
        <View style={styles.centered}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {errorMessage || 'Ocorreu um erro inesperado'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Renderização principal com try-catch
  try {
    return (
      <View style={styles.container}>
        <MobileHeader userName={user?.name || 'Usuário'} />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={onRefresh}
              colors={[colors.water.primary]}
              tintColor={colors.water.primary}
              title="Atualizando dados..."
              titleColor={colors.mutedForeground}
            />
          }
        >
          <View style={styles.content}>
            <Text style={styles.title}>Sistema de Monitoramento da Água</Text>
            
            <AnalysisCard 
              lastUpdate={getLastUpdateText()}
              data={getAnalysisData()}
            />
            
            <LocationCard devices={getDevicesData()} />
            
            <QuickActionsGrid onActionPress={handleActionPress} />
            
            <DeviceSwitchCard onSwitch={handleDeviceSwitch} />
          </View>
        </ScrollView>
      </View>
    );
  } catch (renderError) {
    console.error('❌ Erro crítico na renderização:', renderError);
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Erro de renderização. Reinicie o aplicativo.
          </Text>
        </View>
      </View>
    );
  }
};


