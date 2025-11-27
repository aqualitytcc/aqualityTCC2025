import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { ArrowLeft, Activity, Clock, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MobileHeader } from '../components/MobileHeader';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { useAuth } from '../contexts/AuthContext';
import { deviceService } from '../services/deviceService';

const { width } = Dimensions.get('window');

interface SensorData {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  battery: number;
  lastUpdate: string;
  currentData: {
    ph: number;
    turbidity: number;
    conductivity: number;
    temperature: number;
  };
  history: {
    id: string;
    timestamp: string;
    ph: number;
    turbidity: number;
    conductivity: number;
    temperature: number;
  }[];
}

const mockSensorData: SensorData = {
  id: '1',
  name: 'Aquality01',
  location: 'Casa Principal',
  status: 'online',
  battery: 85,
  lastUpdate: '2 min atrás',
  currentData: {
    ph: 6.8,
    turbidity: 8,
    conductivity: 2.21,
    temperature: 20,
  },
  history: [
    {
      id: '1',
      timestamp: '15:47 - Hoje',
      ph: 6.8,
      turbidity: 8,
      conductivity: 2.21,
      temperature: 20,
    },
    {
      id: '2',
      timestamp: '14:30 - Hoje',
      ph: 6.5,
      turbidity: 6,
      conductivity: 2.15,
      temperature: 19,
    },
    {
      id: '3',
      timestamp: '13:15 - Hoje',
      ph: 6.9,
      turbidity: 7,
      conductivity: 2.18,
      temperature: 21,
    },
    {
      id: '4',
      timestamp: '12:00 - Hoje',
      ph: 7.0,
      turbidity: 5,
      conductivity: 2.20,
      temperature: 22,
    },
    {
      id: '5',
      timestamp: '10:30 - Hoje',
      ph: 6.7,
      turbidity: 9,
      conductivity: 2.25,
      temperature: 18,
    },
  ],
};

export const SensorDetails: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  // Estados para dados reais
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceData, setDeviceData] = useState<any>(null);
  const [leituras, setLeituras] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pullProgress = useState(new Animated.Value(0))[0];
  
  // Pega o dispositivo dos parâmetros de navegação
  const device = (route.params as any)?.device;

  useEffect(() => {
    if (device?.id) {
      carregarDadosDispositivo();
    } else {
      setError('Dispositivo não encontrado');
      setLoading(false);
    }
  }, [device?.id]);

  const carregarDadosDispositivo = async () => {
    if (!device?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Carregando dados do dispositivo:', device.id);
      const response = await deviceService.buscarLeituras(device.id, 10);
      
      if (response.status === 'sucesso' && response.dados) {
        setDeviceData(response.dados.dispositivo);
        setLeituras(response.dados.leituras || []);
        console.log('✅ Dados carregados:', response.dados);
      } else {
        throw new Error(response.mensagem || 'Erro ao carregar dados');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar dispositivo:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDadosDispositivo();
    setRefreshing(false);
  };

  // Dados para exibição (dados reais ou fallback)
  const displayData = deviceData || {
    nome: device?.nome || 'Dispositivo',
    localizacao: device?.localizacao || 'Localização não informada'
  };
  
  const currentReading = leituras.length > 0 ? leituras[0] : null;
  const previousReading = leituras.length > 1 ? leituras[1] : null;
  
  const currentData = currentReading ? {
    ph: currentReading.ph,
    turbidity: currentReading.turbidez,
    conductivity: currentReading.condutividade,
    temperature: currentReading.temperatura
  } : {
    ph: null,
    turbidity: null,
    conductivity: null,
    temperature: null
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MobileHeader userName={user?.name} />
        <ActivityIndicator size="large" color={colors.water.primary} />
        <Text style={styles.loadingText}>Carregando dados do sensor...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MobileHeader userName={user?.name} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={carregarDadosDispositivo}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getTrendIcon = (current: number, previous: number) => {
    return current > previous ? (
      <TrendingUp size={16} color={colors.success} />
    ) : (
      <TrendingDown size={16} color={colors.danger} />
    );
  };

  const getTrendColor = (current: number, previous: number) => {
    return current > previous ? colors.success : colors.danger;
  };

  const formatValue = (value: number | null, unit: string) => {
    return value !== null ? `${value}${unit}` : 'NULL';
  };

  const getParameterStatus = (value: number | null, parameter: string) => {
    if (value === null) return { status: 'unknown', text: 'NULL' };
    
    switch (parameter) {
      case 'ph':
        if (value < 6.5 || value > 8.5) return { status: 'danger', text: 'Crítico' };
        if (value < 7.0 || value > 8.0) return { status: 'warning', text: 'Atenção' };
        return { status: 'normal', text: 'Normal' };
      case 'turbidity':
        if (value > 50) return { status: 'danger', text: 'Crítico' };
        if (value > 25) return { status: 'warning', text: 'Atenção' };
        return { status: 'normal', text: 'Normal' };
      case 'conductivity':
        if (value > 2.5) return { status: 'danger', text: 'Crítico' };
        if (value > 2.0) return { status: 'warning', text: 'Atenção' };
        return { status: 'normal', text: 'Normal' };
      case 'temperature':
        if (value < 15 || value > 30) return { status: 'danger', text: 'Crítico' };
        if (value < 18 || value > 25) return { status: 'warning', text: 'Atenção' };
        return { status: 'normal', text: 'Normal' };
      default:
        return { status: 'normal', text: 'Normal' };
    }
  };

  return (
    <View style={styles.container}>
      <MobileHeader userName={user?.name} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.water.primary]}
            tintColor={colors.water.primary}
            title="Atualizando dados do sensor..."
            titleColor={colors.mutedForeground}
          />
        }
      >
        <View style={styles.content}>
          {/* Header com botão voltar */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.title}>Detalhes do Sensor</Text>
          </View>

          {/* Informações do sensor */}
          <View style={styles.sensorInfo}>
            <View style={styles.sensorHeader}>
              <View style={styles.sensorIcon}>
                <Activity size={32} color={colors.water.primary} />
              </View>
              <View style={styles.sensorDetails}>
                <Text style={styles.sensorName}>{displayData.nome}</Text>
                <Text style={styles.sensorLocation}>{displayData.localizacao}</Text>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: leituras.length > 0 ? colors.success : colors.mutedForeground }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: leituras.length > 0 ? colors.success : colors.mutedForeground }
                  ]}>
                    {leituras.length > 0 ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sensorStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total de Leituras</Text>
                <Text style={styles.statValue}>{leituras.length}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Última atualização</Text>
                <Text style={styles.statValue}>
                  {currentReading ? new Date(currentReading.data_hora).toLocaleString('pt-BR') : 'Nunca'}
                </Text>
              </View>
            </View>
          </View>

          {/* Dados atuais */}
          <View style={styles.currentDataSection}>
            <Text style={styles.sectionTitle}>Dados Atuais</Text>
            <View style={styles.currentDataGrid}>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>PH</Text>
                <Text style={styles.dataValue}>{formatValue(currentData.ph, '')}</Text>
                <Text style={[
                  styles.dataStatus,
                  { color: getParameterStatus(currentData.ph, 'ph').status === 'danger' ? colors.danger : 
                           getParameterStatus(currentData.ph, 'ph').status === 'warning' ? colors.warning : colors.success }
                ]}>
                  {getParameterStatus(currentData.ph, 'ph').text}
                </Text>
              </View>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>Turbidez</Text>
                <Text style={styles.dataValue}>{formatValue(currentData.turbidity, '%')}</Text>
                <Text style={[
                  styles.dataStatus,
                  { color: getParameterStatus(currentData.turbidity, 'turbidity').status === 'danger' ? colors.danger : 
                           getParameterStatus(currentData.turbidity, 'turbidity').status === 'warning' ? colors.warning : colors.success }
                ]}>
                  {getParameterStatus(currentData.turbidity, 'turbidity').text}
                </Text>
              </View>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>Condutividade</Text>
                <Text style={styles.dataValue}>{formatValue(currentData.conductivity, '')}</Text>
                <Text style={[
                  styles.dataStatus,
                  { color: getParameterStatus(currentData.conductivity, 'conductivity').status === 'danger' ? colors.danger : 
                           getParameterStatus(currentData.conductivity, 'conductivity').status === 'warning' ? colors.warning : colors.success }
                ]}>
                  {getParameterStatus(currentData.conductivity, 'conductivity').text}
                </Text>
              </View>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>Temperatura</Text>
                <Text style={styles.dataValue}>{formatValue(currentData.temperature, '°C')}</Text>
                <Text style={[
                  styles.dataStatus,
                  { color: getParameterStatus(currentData.temperature, 'temperature').status === 'danger' ? colors.danger : 
                           getParameterStatus(currentData.temperature, 'temperature').status === 'warning' ? colors.warning : colors.success }
                ]}>
                  {getParameterStatus(currentData.temperature, 'temperature').text}
                </Text>
              </View>
            </View>
          </View>

          {/* Histórico */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Histórico de Dados</Text>
            <View style={styles.historyList}>
              {leituras.length > 0 ? leituras.map((record, index) => (
                <View key={record.id || index} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <View style={styles.timeContainer}>
                      <Clock size={14} color={colors.mutedForeground} />
                      <Text style={styles.timeText}>
                        {new Date(record.data_hora).toLocaleString('pt-BR')}
                      </Text>
                    </View>
                    {index > 0 && (
                      <View style={styles.trendContainer}>
                        {getTrendIcon(record.ph, leituras[index - 1].ph)}
                        <Text style={[
                          styles.trendText,
                          { color: getTrendColor(record.ph, leituras[index - 1].ph) }
                        ]}>
                          PH
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.historyData}>
                    <View style={styles.historyDataItem}>
                      <Text style={styles.historyLabel}>PH</Text>
                      <Text style={styles.historyValue}>{record.ph !== null ? record.ph : 'NULL'}</Text>
                    </View>
                    <View style={styles.historyDataItem}>
                      <Text style={styles.historyLabel}>Turbidez</Text>
                      <Text style={styles.historyValue}>{record.turbidez !== null ? `${record.turbidez}%` : 'NULL'}</Text>
                    </View>
                    <View style={styles.historyDataItem}>
                      <Text style={styles.historyLabel}>Condutividade</Text>
                      <Text style={styles.historyValue}>{record.condutividade !== null ? record.condutividade : 'NULL'}</Text>
                    </View>
                    <View style={styles.historyDataItem}>
                      <Text style={styles.historyLabel}>Temperatura</Text>
                      <Text style={styles.historyValue}>{record.temperatura !== null ? `${record.temperatura}°C` : 'NULL'}</Text>
                    </View>
                  </View>
                </View>
              )) : (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>Nenhuma leitura encontrada</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120,
    paddingBottom: 100,
    paddingHorizontal: spacing.md,
  },
  content: {
    maxWidth: width,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
  },
  sensorInfo: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    ...shadows.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sensorIcon: {
    width: 60,
    height: 60,
    backgroundColor: `${colors.water.primary}10`,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sensorDetails: {
    flex: 1,
  },
  sensorName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  sensorLocation: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  sensorStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
  },
  currentDataSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  currentDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dataCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '48%',
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  dataLabel: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  dataValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  dataStatus: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  historySection: {
    marginBottom: spacing.lg,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
    marginLeft: spacing.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs,
  },
  historyData: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  historyDataItem: {
    width: '48%',
    marginBottom: spacing.xs,
  },
  historyLabel: {
    fontSize: typography.sizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  historyValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.foreground,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.danger,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.water.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  emptyHistory: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});


