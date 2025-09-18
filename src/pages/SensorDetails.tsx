import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { ArrowLeft, Activity, Clock, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MobileHeader } from '../components/MobileHeader';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';

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
  const [sensorData] = useState<SensorData>(mockSensorData);

  const getStatusColor = (status: string) => {
    return status === 'online' ? colors.success : colors.mutedForeground;
  };

  const getStatusText = (status: string) => {
    return status === 'online' ? 'Online' : 'Offline';
  };

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

  const formatValue = (value: number, unit: string) => {
    return `${value}${unit}`;
  };

  const getParameterStatus = (value: number, parameter: string) => {
    switch (parameter) {
      case 'ph':
        if (value < 6.5 || value > 8.5) return { status: 'danger', text: 'Crítico' };
        if (value < 7.0 || value > 8.0) return { status: 'warning', text: 'Atenção' };
        return { status: 'normal', text: 'Normal' };
      case 'turbidity':
        if (value > 10) return { status: 'danger', text: 'Crítico' };
        if (value > 5) return { status: 'warning', text: 'Atenção' };
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
      <MobileHeader userName="Rodinei Almirante Silva" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
                <Text style={styles.sensorName}>{sensorData.name}</Text>
                <Text style={styles.sensorLocation}>{sensorData.location}</Text>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(sensorData.status) }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(sensorData.status) }
                  ]}>
                    {getStatusText(sensorData.status)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sensorStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Bateria</Text>
                <Text style={[
                  styles.statValue,
                  { color: sensorData.battery > 20 ? colors.success : colors.danger }
                ]}>
                  {sensorData.battery}%
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Última atualização</Text>
                <Text style={styles.statValue}>{sensorData.lastUpdate}</Text>
              </View>
            </View>
          </View>

          {/* Dados atuais */}
          <View style={styles.currentDataSection}>
            <Text style={styles.sectionTitle}>Dados Atuais</Text>
            <View style={styles.currentDataGrid}>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>PH</Text>
                <Text style={styles.dataValue}>{formatValue(sensorData.currentData.ph, '')}</Text>
                <Text style={[
                  styles.dataStatus,
                  { color: getParameterStatus(sensorData.currentData.ph, 'ph').status === 'danger' ? colors.danger : 
                           getParameterStatus(sensorData.currentData.ph, 'ph').status === 'warning' ? colors.warning : colors.success }
                ]}>
                  {getParameterStatus(sensorData.currentData.ph, 'ph').text}
                </Text>
              </View>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>Turbidez</Text>
                <Text style={styles.dataValue}>{formatValue(sensorData.currentData.turbidity, ' NTU')}</Text>
                <Text style={[
                  styles.dataStatus,
                  { color: getParameterStatus(sensorData.currentData.turbidity, 'turbidity').status === 'danger' ? colors.danger : 
                           getParameterStatus(sensorData.currentData.turbidity, 'turbidity').status === 'warning' ? colors.warning : colors.success }
                ]}>
                  {getParameterStatus(sensorData.currentData.turbidity, 'turbidity').text}
                </Text>
              </View>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>Condutividade</Text>
                <Text style={styles.dataValue}>{formatValue(sensorData.currentData.conductivity, '')}</Text>
                <Text style={[
                  styles.dataStatus,
                  { color: getParameterStatus(sensorData.currentData.conductivity, 'conductivity').status === 'danger' ? colors.danger : 
                           getParameterStatus(sensorData.currentData.conductivity, 'conductivity').status === 'warning' ? colors.warning : colors.success }
                ]}>
                  {getParameterStatus(sensorData.currentData.conductivity, 'conductivity').text}
                </Text>
              </View>
              <View style={styles.dataCard}>
                <Text style={styles.dataLabel}>Temperatura</Text>
                <Text style={styles.dataValue}>{formatValue(sensorData.currentData.temperature, '°C')}</Text>
                <Text style={[
                  styles.dataStatus,
                  { color: getParameterStatus(sensorData.currentData.temperature, 'temperature').status === 'danger' ? colors.danger : 
                           getParameterStatus(sensorData.currentData.temperature, 'temperature').status === 'warning' ? colors.warning : colors.success }
                ]}>
                  {getParameterStatus(sensorData.currentData.temperature, 'temperature').text}
                </Text>
              </View>
            </View>
          </View>

          {/* Histórico */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Histórico de Dados</Text>
            <View style={styles.historyList}>
              {sensorData.history.map((record, index) => (
                <View key={record.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <View style={styles.timeContainer}>
                      <Clock size={14} color={colors.mutedForeground} />
                      <Text style={styles.timeText}>{record.timestamp}</Text>
                    </View>
                    {index > 0 && (
                      <View style={styles.trendContainer}>
                        {getTrendIcon(record.ph, sensorData.history[index - 1].ph)}
                        <Text style={[
                          styles.trendText,
                          { color: getTrendColor(record.ph, sensorData.history[index - 1].ph) }
                        ]}>
                          PH
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.historyData}>
                    <View style={styles.historyDataItem}>
                      <Text style={styles.historyLabel}>PH</Text>
                      <Text style={styles.historyValue}>{record.ph}</Text>
                    </View>
                    <View style={styles.historyDataItem}>
                      <Text style={styles.historyLabel}>Turbidez</Text>
                      <Text style={styles.historyValue}>{record.turbidity} NTU</Text>
                    </View>
                    <View style={styles.historyDataItem}>
                      <Text style={styles.historyLabel}>Condutividade</Text>
                      <Text style={styles.historyValue}>{record.conductivity}</Text>
                    </View>
                    <View style={styles.historyDataItem}>
                      <Text style={styles.historyLabel}>Temperatura</Text>
                      <Text style={styles.historyValue}>{record.temperature}°C</Text>
                    </View>
                  </View>
                </View>
              ))}
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
});


