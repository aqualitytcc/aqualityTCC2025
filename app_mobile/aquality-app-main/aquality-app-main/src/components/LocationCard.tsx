import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { LocationCardProps } from '../types';

export const LocationCard: React.FC<LocationCardProps> = ({ devices }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dispositivos Conectados</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {devices.map((device, index) => (
          <View key={index} style={styles.deviceCard}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: device.active ? colors.success : colors.mutedForeground }
            ]} />
            <Text style={styles.deviceName} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={styles.deviceStatus}>
              {device.active ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    ...shadows.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
    maxHeight: 180, // Limitar a altura máxima
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingRight: spacing.md,
  },
  deviceCard: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    minWidth: 100,
    maxWidth: 120,
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: spacing.sm,
  },
  deviceName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  deviceStatus: {
    fontSize: typography.sizes.xs,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
