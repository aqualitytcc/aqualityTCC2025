import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export const Signup: React.FC = () => {
  const navigation = useNavigation();
  const { signup, isLoading } = useAuth();
  
  // Estados para os campos do formulário
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  /**
   * Valida os dados do formulário antes do envio
   */
  const validarFormulario = (): boolean => {
    // Verifica campos obrigatórios
    if (!nome.trim() || !sobrenome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return false;
    }

    // Valida nome e sobrenome
    if (nome.trim().length < 2) {
      Alert.alert('Erro', 'Nome deve ter pelo menos 2 caracteres');
      return false;
    }

    if (sobrenome.trim().length < 2) {
      Alert.alert('Erro', 'Sobrenome deve ter pelo menos 2 caracteres');
      return false;
    }

    // Valida formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return false;
    }

    // Valida força da senha
    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    // Verifica se a senha contém pelo menos uma letra e um número
    const senhaRegex = /^(?=.*[a-z])(?=.*\d)/;
    if (!senhaRegex.test(senha)) {
      Alert.alert('Erro', 'A senha deve conter pelo menos uma letra minúscula e um número');
      return false;
    }

    // Verifica se as senhas coincidem
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return false;
    }

    return true;
  };

  /**
   * Manipula o envio do formulário de cadastro
   */
  const handleSignup = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      const userData = {
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
        email: email.trim().toLowerCase(),
        senha: senha
      };

      const success = await signup(userData);
      
      if (success) {
        Alert.alert(
          'Sucesso!', 
          'Conta criada com sucesso! Você já está logado.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Erro', 
          'Não foi possível criar a conta. Verifique os dados e tente novamente.'
        );
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      Alert.alert('Erro', 'Erro inesperado. Tente novamente.');
    }
  };

  /**
   * Navega de volta para a tela de login
   */
  const voltarParaLogin = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header com botão voltar */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={voltarParaLogin}
            >
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Voltar</Text>
          </View>

          {/* Título principal */}
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>
            Preencha os dados abaixo para criar sua conta no A-Quality
          </Text>
          
          {/* Formulário */}
          <View style={styles.form}>
            {/* Campo Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome *</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu nome"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                value={nome}
                onChangeText={setNome}
                maxLength={50}
              />
            </View>

            {/* Campo Sobrenome */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sobrenome *</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu sobrenome"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                value={sobrenome}
                onChangeText={setSobrenome}
                maxLength={50}
              />
            </View>

            {/* Campo Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu email"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                maxLength={100}
              />
            </View>

            {/* Campo Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Senha *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Digite sua senha"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  value={senha}
                  onChangeText={setSenha}
                  maxLength={50}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setMostrarSenha(!mostrarSenha)}
                >
                  {mostrarSenha ? (
                    <EyeOff size={20} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={20} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>
                Mínimo 6 caracteres, incluindo letra e número
              </Text>
            </View>

            {/* Campo Confirmar Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Senha *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirme sua senha"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!mostrarConfirmarSenha}
                  autoCapitalize="none"
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  maxLength={50}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                >
                  {mostrarConfirmarSenha ? (
                    <EyeOff size={20} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={20} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão de Cadastro */}
            <TouchableOpacity 
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={styles.signupButtonText}>Criar Conta</Text>
              )}
            </TouchableOpacity>

            {/* Link para Login */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={voltarParaLogin}>
                <Text style={styles.loginLink}>Faça login aqui</Text>
              </TouchableOpacity>
            </View>

            {/* Informações adicionais */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Sobre o A-Quality:</Text>
              <Text style={styles.infoText}>
                Sistema de monitoramento de qualidade da água em tempo real usando sensores IoT.
              </Text>
              <Text style={styles.infoText}>
                • Monitoramento de pH, turbidez, condutividade e temperatura{'\n'}
                • Alertas automáticos para valores críticos{'\n'}
                • Histórico completo de medições{'\n'}
                • Interface intuitiva e fácil de usar
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  content: {
    flex: 1,
    maxWidth: width - spacing.xl * 2,
    alignSelf: 'center',
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    color: colors.foreground,
    fontWeight: typography.weights.medium,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.foreground,
    ...shadows.card,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.card,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.foreground,
  },
  eyeButton: {
    padding: spacing.md,
  },
  passwordHint: {
    fontSize: typography.sizes.xs,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  signupButton: {
    backgroundColor: colors.water.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.button,
  },
  signupButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginLinkText: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
  },
  loginLink: {
    fontSize: typography.sizes.sm,
    color: colors.water.primary,
    fontWeight: typography.weights.semibold,
  },
  infoContainer: {
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  infoTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
});