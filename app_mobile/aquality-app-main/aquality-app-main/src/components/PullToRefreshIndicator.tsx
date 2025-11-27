import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, typography } from '../utils/colors';

interface PullToRefreshIndicatorProps {
  progress: Animated.Value;
  isRefreshing: boolean;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({ 
  progress, 
  isRefreshing 
}) => {
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.1, 1],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.indicator,
          {
            transform: [
              { rotate },
              { scale },
            ],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logo} />
        </View>
      </Animated.View>
      <Text style={styles.text}>
        {isRefreshing ? 'Atualizando...' : 'Puxe para atualizar'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  indicator: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  logoContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.water.primary,
  },
  text: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
  },
});