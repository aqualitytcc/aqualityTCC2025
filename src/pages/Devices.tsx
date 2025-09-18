import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Plus, Smartphone, Wifi, WifiOff, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { MobileHeader } from '../components/MobileHeader';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';

const { width } = Dimensions.get('window');

const devices = [
  {
    id: '1',
    name: 'Aquality01',
    location: 'Casa Principal',
    status: 'online',
    lastUpdate: '2 min atrás',
    battery: 85,
  },
  {
    id: '2',
    name: 'Casa02',
    location: 'Garagem',
    status: 'offline',
    lastUpdate: '1 hora atrás',
    battery: 12,
  },
  {
    id: '3',
    name: 'Localização 03',
    location: 'Jardim',
    status: 'offline',
    lastUpdate: '3 horas atrás',
    battery: 0,
  },
];

export const Devices: React.FC = () => {
  const navigation = useNavigation();

  const getStatusIcon = (status: string) => {
    return status === 'online' ? (
      <Wifi size={16} color={colors.success} />
    ) : (
      <WifiOff size={16} color={colors.mutedForeground} />
    );
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? colors.success : colors.mutedForeground;
  };

  const handleDevicePress = (device: any) => {
    navigation.navigate('SensorDetails' as never, { device });
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
          <View style={styles.header}>
            <Text style={styles.title}>Meus Dispositivos</Text>
            <TouchableOpacity style={styles.addButton}>
              <Plus size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Gerencie seus sensores de qualidade da água
          </Text>

          <View style={styles.devicesList}>
            {devices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={styles.deviceCard}
                onPress={() => handleDevicePress(device)}
                activeOpacity={0.7}
              >
                <View style={styles.deviceHeader}>
                  <View style={styles.deviceInfo}>
                    <View style={styles.deviceIcon}>
                      <Smartphone size={24} color={colors.water.primary} />
                    </View>
                    <View style={styles.deviceDetails}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <Text style={styles.deviceLocation}>{device.location}</Text>
                    </View>
                  </View>
                  <View style={styles.statusContainer}>
                    {getStatusIcon(device.status)}
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(device.status) }
                    ]}>
                      {device.status === 'online' ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </View>

                <View style={styles.deviceStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Última atualização</Text>
                    <Text style={styles.statValue}>{device.lastUpdate}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Bateria</Text>
                    <Text style={[
                      styles.statValue,
                      { color: device.battery > 20 ? colors.success : colors.danger }
                    ]}>
                      {device.battery}%
                    </Text>
                  </View>
                </View>

                <View style={styles.batteryBar}>
                  <View 
                    style={[
                      styles.batteryFill,
                      { 
                        width: `${device.battery}%`,
                        backgroundColor: device.battery > 20 ? colors.success : colors.danger
                      }
                    ]} 
                  />
                </View>

                <View style={styles.deviceFooter}>
                  <Text style={styles.viewDetailsText}>Ver detalhes</Text>
                  <ChevronRight size={16} color={colors.water.primary} />
                </View>
              </TouchableOpacity>
            ))}
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
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.water.primary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    marginBottom: spacing.lg,
  },
  devicesList: {
    gap: spacing.md,
  },
  deviceCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    ...shadows.card,
    padding: spacing.md,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    backgroundColor: `${colors.water.primary}10`,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  deviceLocation: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.foreground,
  },
  batteryBar: {
    height: 4,
    backgroundColor: colors.muted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 2,
  },
  deviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewDetailsText: {
    fontSize: typography.sizes.sm,
    color: colors.water.primary,
    fontWeight: typography.weights.medium,
  },
});
