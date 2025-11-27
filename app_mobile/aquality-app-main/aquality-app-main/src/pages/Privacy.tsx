import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { MobileHeader } from '../components/MobileHeader';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export const Privacy: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <View style={styles.container}>
      <MobileHeader userName={user?.name} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Política de Privacidade</Text>
          <Text style={styles.subtitle}>Seu controle e segurança de dados</Text>

          <View style={styles.card}>
            <Text style={styles.paragraph}>Coletamos apenas os dados necessários para operação do sistema e melhoria contínua.</Text>
            <Text style={styles.paragraph}>Você pode solicitar a exclusão dos seus dados a qualquer momento através dos canais de suporte.</Text>
            <Text style={styles.paragraph}>Todos os dados são criptografados em trânsito e em repouso.</Text>
            <Text style={styles.paragraph}>Utilizamos cookies e identificadores para manter sua sessão autenticada com segurança.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 120, paddingBottom: 100, paddingHorizontal: spacing.md },
  content: { maxWidth: width, alignSelf: 'center' },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.foreground, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sizes.md, color: colors.mutedForeground, marginBottom: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.card, padding: spacing.lg },
  paragraph: { fontSize: typography.sizes.md, color: colors.foreground, lineHeight: 22, marginBottom: spacing.md },
});



