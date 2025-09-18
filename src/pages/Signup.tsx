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
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';

const { width } = Dimensions.get('window');

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular cadastro
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Sucesso', 'Conta criada com sucesso!', [
        { text: 'OK', onPress: () => console.log('Navigate to login') }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Preencha os dados para se cadastrar</Text>
        
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nome Completo *"
            placeholderTextColor={colors.mutedForeground}
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Telefone"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Senha *"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirmar Senha *"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
          />
          
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
          
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Já tem conta? Faça login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
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
  signupButton: {
    backgroundColor: colors.water.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.button,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  loginButton: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginButtonText: {
    color: colors.water.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
});

