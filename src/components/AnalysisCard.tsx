// Importa a biblioteca React para criar componentes funcionais
import React from 'react';
// Importa componentes básicos do React Native
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
// Importa ícones de tendência para indicar subida/descida
import { TrendingUp, TrendingDown } from 'lucide-react-native';
// Importa utilitários de estilo e constantes de design do projeto
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
// Importa o tipo das props esperadas pelo componente
import { AnalysisCardProps } from '../types';

// Componente de cartão de análise, exibe informações resumidas de análise de sensores
export const AnalysisCard: React.FC<AnalysisCardProps> = ({ lastUpdate, data }) => {
  // Função auxiliar para retornar o ícone de tendência (subida/descida)
  const getStatusIcon = (trend: 'up' | 'down') => {
    // Se a tendência for 'up', retorna o ícone de subida, senão o de descida
    return trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
  };

  // Função auxiliar para definir a cor do texto de acordo com o status/trend
  const getStatusColor = (trend: 'up' | 'down', status?: string) => {
    if (status === 'danger') return colors.danger; // Vermelho para perigo
    if (status === 'warning') return colors.warning; // Amarelo para alerta
    // Verde para subida, vermelho para descida
    return trend === 'up' ? colors.success : colors.danger;
  };

  // Renderização do cartão de análise
  return (
    <View style={styles.container}>
      {/* Cabeçalho do cartão: status e última atualização */}
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
          </View>
          <Text style={styles.statusText}>Online</Text>
        </View>
        {/* Exibe a data/hora da última atualização */}
        <Text style={styles.lastUpdate}>{lastUpdate}</Text>
      </View>
      {/* Título do cartão */}
      <Text style={styles.title}>Ultima Análise</Text>
      {/* Grid de dados de análise */}
      <View style={styles.grid}>
        {data.map((item, index) => (
          <View key={index} style={styles.item}>
            {/* Rótulo do dado */}
            <Text style={styles.itemLabel}>{item.label}</Text>
            {/* Valor principal */}
            <Text style={styles.itemValue}>{item.value}</Text>
            {/* Indicador de mudança e tendência */}
            <View style={styles.changeContainer}>
              {getStatusIcon(item.trend)}
              <Text style={[
                styles.changeText,
                { color: getStatusColor(item.trend, item.status) }
              ]}>
                {item.change}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// Estilos do componente AnalysisCard
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card, // Cor de fundo do cartão
    borderRadius: borderRadius.xl, // Bordas arredondadas
    ...shadows.card, // Sombra customizada
    padding: spacing.md, // Espaçamento interno
    marginBottom: spacing.lg, // Espaçamento externo inferior
  },
  header: {
    flexDirection: 'row', // Alinha elementos lado a lado
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 32,
    height: 32,
    backgroundColor: `${colors.success}20`, // Fundo esverdeado translúcido
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.success, // Verde para status online
    borderRadius: 4,
  },
  statusText: {
    color: colors.foreground,
    fontWeight: typography.weights.medium,
  },
  lastUpdate: {
    color: colors.mutedForeground, // Cor de texto mais suave
    fontSize: typography.sizes.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    backgroundColor: `${colors.muted}50`, // Fundo levemente colorido
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    width: '48%',
    marginBottom: spacing.sm,
    minHeight: 100, // Altura mínima para evitar compressão
  },
  itemLabel: {
    color: colors.mutedForeground,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  itemValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs,
  },
});
