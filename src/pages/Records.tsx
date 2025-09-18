import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MobileHeader } from '../components/MobileHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { colors, typography, spacing } from '../utils/colors';

const { width } = Dimensions.get('window');

export const Records: React.FC = () => {
  return (
    <View style={styles.container}>
      <MobileHeader userName="Rodinei Almirante Silva" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Histórico de Análises</Text>
          <Text style={styles.subtitle}>Em desenvolvimento...</Text>
        </View>
      </ScrollView>

      <BottomNavigation currentRoute="Records" />
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
  },
});
