import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import { colors, typography, spacing, borderRadius } from '../utils/colors';
import { deviceService } from '../services/deviceService';
import { useAuth } from '../contexts/AuthContext';
import { MobileHeader } from '../components/MobileHeader';

const { width } = Dimensions.get('window');

// Add shadows object at the top to avoid TypeScript error
const shadows = {
  card: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
  }
};

interface Reading {
  id: number;
  dispositivo_id: number;
  ph: number;
  turbidez: number;
  condutividade: number;
  temperatura: number;
  data_hora: string;
}

interface Device {
  id: number;
  nome: string;
  codigo_verificacao: string;
  localizacao: string;
  status: 'online' | 'offline';
  nivel_bateria: number;
  data_criacao: string;
  total_leituras: number;
}

export const Progress: React.FC = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadReadings(selectedDevice);
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await deviceService.listarDispositivos(user.id);
      
      if (response.status === 'sucesso' && response.dados) {
        setDevices(response.dados);
        if (response.dados.length > 0 && !selectedDevice) {
          setSelectedDevice(response.dados[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dispositivos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const loadReadings = async (deviceId: number) => {
    try {
      const response = await deviceService.buscarLeituras(deviceId, 20);
      
      if (response.status === 'sucesso' && response.dados) {
        // Ordenar leituras por data (mais recente primeiro)
        const sortedReadings = response.dados.leituras
          .sort((a: any, b: any) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())
          .slice(0, 15); // Limitar a 15 leituras para melhor visualização
        
        setReadings(sortedReadings);
      }
    } catch (error) {
      console.error('Erro ao carregar leituras:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do dispositivo');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
    if (selectedDevice) {
      await loadReadings(selectedDevice);
    }
    setRefreshing(false);
  };

  // Funções para preparar dados para os gráficos
  const prepareChartData = (parameter: keyof Reading) => {
    if (readings.length === 0) {
      return {
        labels: [] as string[],
        datasets: [{
          data: [] as number[],
          strokeWidth: 2,
        }]
      };
    }

    // Extrair apenas os valores para o parâmetro específico
    const data = readings
      .map(reading => reading[parameter])
      .filter(value => typeof value === 'number' && !isNaN(value))
      .reverse() as number[]; // Inverter para mostrar da mais antiga para a mais recente

    // =======================================================================
    // A ALTERAÇÃO FOI FEITA AQUI
    // Agora, as legendas são criadas com um intervalo para evitar sobreposição.
    const labelInterval = 3; // Mostrar uma legenda a cada 3 pontos de dados.
    const labels = readings
      .map((reading, index) => {
        // Só retorna a legenda se o índice for um múltiplo do intervalo.
        if (index % labelInterval === 0) {
          const date = new Date(reading.data_hora);
          return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        return ''; // Retorna uma string vazia para os outros pontos.
      })
      .reverse();
    // =======================================================================

    return {
      labels: labels.length > 0 ? labels : ['Sem dados'],
      datasets: [{
        data: data.length > 0 ? data : [0],
        strokeWidth: 2,
      }]
    };
  };

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: colors.card,
    backgroundGradientToOpacity: 0.5,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 2,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.water.primary,
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
            title="Puxe para atualizar"
            titleColor={colors.mutedForeground}
          />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Evolução dos Indicadores</Text>
          <Text style={styles.subtitle}>Acompanhe a qualidade da água ao longo do tempo</Text>
          
          {devices.length > 0 && (
            <View style={styles.deviceSelector}>
              <Text style={styles.selectorLabel}>Selecione um dispositivo:</Text>
              <Picker
                selectedValue={selectedDevice}
                style={styles.picker}
                onValueChange={(value: any) => setSelectedDevice(value as number)}
              >
                {devices.map(device => (
                  <Picker.Item 
                    key={device.id} 
                    label={`${device.nome} (${device.localizacao})`} 
                    value={device.id} 
                  />
                ))}
              </Picker>
            </View>
          )}
          
          {readings.length > 0 ? (
            <>
              {/* Gráfico de pH */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>pH</Text>
                <LineChart
                  data={prepareChartData('ph')}
                  width={width - 32}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix=""
                  fromZero={true}
                  yAxisInterval={1}
                />
                <Text style={styles.chartDescription}>
                  O pH ideal para água potável está entre 6.5 e 8.5
                </Text>
              </View>
              
              {/* Gráfico de Turbidez */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Turbidez (%)</Text>
                <LineChart
                  data={prepareChartData('turbidez')}
                  width={width - 32}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix="%"
                  fromZero={true}
                />
                <Text style={styles.chartDescription}>
                  A turbidez máxima permitida é de 50% para água potável
                </Text>
              </View>
              
              {/* Gráfico de Condutividade */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Condutividade (µS/cm)</Text>
                <LineChart
                  data={prepareChartData('condutividade')}
                  width={width - 32}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix=" µS/cm"
                  fromZero={true}
                />
                <Text style={styles.chartDescription}>
                  A condutividade indica a presença de sais dissolvidos na água
                </Text>
              </View>
              
              {/* Gráfico de Temperatura */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Temperatura (°C)</Text>
                <LineChart
                  data={prepareChartData('temperatura')}
                  width={width - 32}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix="°C"
                  fromZero={false}
                />
                <Text style={styles.chartDescription}>
                  A temperatura afeta a solubilidade de gases e a atividade biológica
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {selectedDevice 
                  ? 'Nenhum dado disponível para este dispositivo' 
                  : 'Selecione um dispositivo para visualizar os dados'}
              </Text>
            </View>
          )}
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
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    marginBottom: spacing.lg,
  },
  deviceSelector: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  selectorLabel: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  chartTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  chart: {
    marginVertical: 8,
    borderRadius: borderRadius.lg,
  },
  chartDescription: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});