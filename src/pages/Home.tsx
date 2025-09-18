import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MobileHeader } from '../components/MobileHeader';
import { AnalysisCard } from '../components/AnalysisCard';
import { LocationCard } from '../components/LocationCard';
import { QuickActionsGrid } from '../components/QuickActionsGrid';
import { DeviceSwitchCard } from '../components/DeviceSwitchCard';
import { useToast } from '../hooks/useToast';
import { colors, typography, spacing } from '../utils/colors';
import { useThemeMode } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export const Home: React.FC = () => {
  const navigation = useNavigation();
  const { mode } = useThemeMode();
  const { toast } = useToast();

  const analysisData = [
    {
      label: "PH",
      value: "6.8",
      change: "+0.5",
      trend: "up" as const,
      status: "normal" as const,
    },
    {
      label: "Turbidez",
      value: "8 NTU",
      change: "+2 NTU",
      trend: "up" as const,
      status: "warning" as const,
    },
    {
      label: "Condutividade",
      value: "2.21",
      change: "Água Salinizada!",
      trend: "down" as const,
      status: "danger" as const,
    },
    {
      label: "Temperatura",
      value: "20°C",
      change: "+2°C",
      trend: "up" as const,
      status: "normal" as const,
    },
  ];

  const devices = [
    { name: "Aquality01", active: true },
    { name: "Casa02", active: false },
    { name: "Localização 03", active: false },
  ];

  const handleDeviceSwitch = () => {
    toast({
      title: "Dispositivos",
      description: "Abrindo seleção de dispositivos...",
    });
  };

  const handleActionPress = (action: string) => {
    // Navegação para a rota especificada
    navigation.navigate(action as never);
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
  }), [mode]);

  return (
    <View style={styles.container}>
      <MobileHeader userName="Rodinei Almirante Silva" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Sistema de Monitoramento da Água</Text>
          
          <AnalysisCard 
            lastUpdate="Atualizado hoje às 15:47"
            data={analysisData}
          />
          
          <LocationCard devices={devices} />
          
          <QuickActionsGrid onActionPress={handleActionPress} />
          
          <DeviceSwitchCard onSwitch={handleDeviceSwitch} />
        </View>
      </ScrollView>
    </View>
  );
};

// styles are memoized inside component based on theme
