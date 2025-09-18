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
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    const success = await login(email.trim(), password);
    
    if (success) {
      Alert.alert('Sucesso', 'Login realizado com sucesso!');
    } else {
      Alert.alert('Erro', 'Email ou senha incorretos');
    }
  };

  const fillDefaultCredentials = () => {
    setEmail('aquality@tcc.com');
    setPassword('aqua@123');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo de volta!</Text>
        <Text style={styles.subtitle}>Faça login para continuar</Text>
        
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => Alert.alert('Esqueci minha senha', 'Funcionalidade em desenvolvimento')}
          >
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.fillCredentialsButton}
            onPress={fillDefaultCredentials}
          >
            <Text style={styles.fillCredentialsText}>
              Usar credenciais de teste
            </Text>
          </TouchableOpacity>
          
          <View style={styles.credentialsInfo}>
            <Text style={styles.credentialsTitle}>Credenciais de teste:</Text>
            <Text style={styles.credentialsText}>Email: aquality@tcc.com</Text>
            <Text style={styles.credentialsText}>Senha: aqua@123</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    maxWidth: width,
    alignSelf: 'center',
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
    marginBottom: spacing.xxl,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.foreground,
    ...shadows.card,
  },
  loginButton: {
    backgroundColor: colors.water.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.button,
  },
  loginButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  forgotPasswordText: {
    color: colors.water.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  fillCredentialsButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: `${colors.water.primary}10`,
    borderRadius: borderRadius.lg,
  },
  fillCredentialsText: {
    color: colors.water.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  credentialsInfo: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
  },
  credentialsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  credentialsText: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
});
