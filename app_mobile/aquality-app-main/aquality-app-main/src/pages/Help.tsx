import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Linking } from 'react-native';
import { MobileHeader } from '../components/MobileHeader';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { Mail, Instagram } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export const Help: React.FC = () => {
  const { user } = useAuth();
  const faqs = [
    { q: 'Como parear um novo sensor?', a: 'Acesse Dispositivos > Adicionar e siga as instruções.' },
    { q: 'Como configurar alertas?', a: 'Em Notificações, defina limites e preferências de alerta.' },
    { q: 'Os dados não atualizam, o que fazer?', a: 'Verifique a conexão do sensor e reinicie o aplicativo.' },
  ];

  return (
    <View style={styles.container}>
      <MobileHeader userName={user?.name} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Ajuda e Suporte</Text>
          <Text style={styles.subtitle}>Perguntas frequentes e canais de contato</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FAQ</Text>
            <View style={styles.card}>
              {faqs.map((item, idx) => (
                <View key={idx} style={[styles.faqItem, idx === faqs.length - 1 && styles.lastItem]}>
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fale Conosco</Text>
            <View style={styles.contactRow}>
              <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:aqualitytcc2025@gmail.com')}>
                <Mail size={18} color={colors.water.primary} />
                <Text style={styles.contactText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('https://www.instagram.com/aqualityprojeto/')}>
                <Instagram size={18} color={colors.water.primary} />
                <Text style={styles.contactText}>Instagram</Text>
              </TouchableOpacity>
            </View>
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
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.foreground, marginBottom: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.xl, ...shadows.card, overflow: 'hidden' },
  faqItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  lastItem: { borderBottomWidth: 0 },
  faqQuestion: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.foreground, marginBottom: spacing.xs },
  faqAnswer: { fontSize: typography.sizes.sm, color: colors.mutedForeground, lineHeight: 20 },
  contactRow: { flexDirection: 'row', gap: spacing.sm },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.water.primary}10`, paddingVertical: spacing.md, borderRadius: borderRadius.lg },
  contactText: { marginLeft: spacing.xs, color: colors.water.primary, fontWeight: typography.weights.semibold },
});



