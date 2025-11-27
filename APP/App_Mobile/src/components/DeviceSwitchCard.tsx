import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { DeviceSwitchCardProps } from '../types';

export const DeviceSwitchCard: React.FC<DeviceSwitchCardProps> = ({ onSwitch }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onSwitch}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Trocar Dispositivo</Text>
          <Text style={styles.subtitle}>Selecionar outro sensor</Text>
        </View>
        <ChevronRight size={20} color={colors.water.primary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    ...shadows.card,
    marginBottom: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
  },
});
