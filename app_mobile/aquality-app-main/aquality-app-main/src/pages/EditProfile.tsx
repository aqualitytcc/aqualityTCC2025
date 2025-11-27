import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { ArrowLeft, Save, Camera, Eye, EyeOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { MobileHeader } from '../components/MobileHeader';
import { useAuth } from '../contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { profileService, UpdateProfileData } from '../services/profileService';

const { width } = Dimensions.get('window');

interface EditProfileProps {
  route?: {
    params?: {
      profileData?: any;
    };
  };
}

export const EditProfile: React.FC<EditProfileProps> = ({ route }) => {
  const navigation = useNavigation();
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: '',
    foto_perfil: '',
  });
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Show/hide password
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nome: user.name || '',
        sobrenome: user.sobrenome || '',
        email: user.email || '',
        foto_perfil: route?.params?.profileData?.usuario.foto_perfil || '',
      }));
    }
  }, [user, route?.params]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate name
    const nameValidation = profileService.validateName(formData.nome);
    if (!nameValidation.isValid) {
      newErrors.nome = nameValidation.message;
    }
    
    // Validate surname
    const surnameValidation = profileService.validateName(formData.sobrenome);
    if (!surnameValidation.isValid) {
      newErrors.sobrenome = surnameValidation.message;
    }
    
    // Validate email
    const emailValidation = profileService.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message;
    }
    
    // Validate password if provided
    if (formData.nova_senha) {
      if (!formData.senha_atual) {
        newErrors.senha_atual = 'Senha atual é obrigatória para alterar a senha';
      }
      
      const passwordValidation = profileService.validatePassword(formData.nova_senha);
      if (!passwordValidation.isValid) {
        newErrors.nova_senha = passwordValidation.message;
      }
      
      if (formData.nova_senha !== formData.confirmar_senha) {
        newErrors.confirmar_senha = 'Senhas não coincidem';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Erro', 'Por favor, corrija os erros antes de continuar.');
      return;
    }
    
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const updateData: UpdateProfileData = {
        nome: formData.nome,
        sobrenome: formData.sobrenome,
        email: formData.email,
      };
      
      // Only include password if changing
      if (formData.nova_senha) {
        updateData.senha_atual = formData.senha_atual;
        updateData.nova_senha = formData.nova_senha;
      }
      
      const response = await profileService.updateUserProfile(user.id, updateData);
      
      if (response.status === 'sucesso') {
        Alert.alert(
          'Sucesso!',
          'Perfil atualizado com sucesso.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Update auth context if email changed
                if (formData.nova_senha) {
                  Alert.alert(
                    'Senha Alterada',
                    'Sua senha foi alterada. Por favor, faça login novamente.',
                    [
                      {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                      },
                    ]
                  );
                } else {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Erro', response.mensagem || 'Erro ao atualizar perfil.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erro', 'Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permissão Necessária', 'É necessário permitir acesso à galeria de fotos.');
        return;
      }
      
      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        if (!user?.id) return;
        
        setUploadingPhoto(true);
        
        try {
          const uploadResponse = await profileService.uploadProfilePhoto(user.id, asset.uri);
          
          if (uploadResponse.status === 'sucesso' && uploadResponse.dados) {
            setFormData(prev => ({
              ...prev,
              foto_perfil: uploadResponse.dados!.foto_perfil,
            }));
            
            Alert.alert('Sucesso!', 'Foto atualizada com sucesso.');
          } else {
            Alert.alert('Erro', uploadResponse.mensagem || 'Erro ao fazer upload da foto.');
          }
        } catch (error) {
          console.error('Error uploading photo:', error);
          Alert.alert('Erro', 'Erro ao fazer upload da foto.');
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Erro ao selecionar imagem.');
    }
  };

  const getAvatarSource = () => {
    if (formData.foto_perfil) {
      const url = profileService.getAvatarUrl(formData.foto_perfil);
      if (url) {
        return { uri: url };
      }
    }
    return null;
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
      marginBottom: spacing.lg,
    },
    backButton: {
      padding: spacing.sm,
      marginRight: spacing.md,
    },
    title: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.foreground,
      flex: 1,
    },
    photoSection: {
      alignItems: 'center',
      marginBottom: spacing.xl,
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      ...shadows.card,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: spacing.md,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.water.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitials: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: colors.primaryForeground,
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.water.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.button,
    },
    photoText: {
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    formSection: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...shadows.card,
    },
    sectionTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      marginBottom: spacing.md,
    },
    inputGroup: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.medium,
      color: colors.foreground,
      marginBottom: spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      fontSize: typography.sizes.md,
      color: colors.foreground,
      backgroundColor: colors.background,
    },
    inputError: {
      borderColor: colors.danger,
    },
    errorText: {
      fontSize: typography.sizes.sm,
      color: colors.danger,
      marginTop: spacing.xs,
    },
    passwordInputContainer: {
      position: 'relative',
    },
    passwordToggle: {
      position: 'absolute',
      right: spacing.md,
      top: spacing.md,
      padding: spacing.xs,
    },
    saveButton: {
      backgroundColor: colors.water.primary,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.button,
    },
    saveButtonDisabled: {
      backgroundColor: colors.mutedForeground,
    },
    saveButtonText: {
      color: colors.primaryForeground,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      marginLeft: spacing.xs,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
  });

  return (
    <View style={styles.container}>
      <MobileHeader userName={user?.name} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.title}>Editar Perfil</Text>
          </View>

          {/* Photo Section */}
          <View style={styles.photoSection}>
            <View style={styles.avatarContainer}>
              {getAvatarSource() ? (
                <Image source={getAvatarSource()!} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {profileService.getInitials(`${formData.nome} ${formData.sobrenome}`)}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity style={styles.cameraButton} onPress={handlePhotoUpload}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Camera size={20} color={colors.primaryForeground} />
                )}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.photoText}>
              Toque no ícone da câmera para alterar sua foto
            </Text>
          </View>

          {/* Personal Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={[styles.input, errors.nome && styles.inputError]}
                value={formData.nome}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nome: text }))}
                placeholder="Digite seu nome"
                placeholderTextColor={colors.mutedForeground}
              />
              {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sobrenome</Text>
              <TextInput
                style={[styles.input, errors.sobrenome && styles.inputError]}
                value={formData.sobrenome}
                onChangeText={(text) => setFormData(prev => ({ ...prev, sobrenome: text }))}
                placeholder="Digite seu sobrenome"
                placeholderTextColor={colors.mutedForeground}
              />
              {errors.sobrenome && <Text style={styles.errorText}>{errors.sobrenome}</Text>}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text.toLowerCase() }))}
                placeholder="Digite seu email"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
          </View>

          {/* Change Password */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Alterar Senha</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha Atual</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, errors.senha_atual && styles.inputError]}
                  value={formData.senha_atual}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, senha_atual: text }))}
                  placeholder="Digite sua senha atual"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={20} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.senha_atual && <Text style={styles.errorText}>{errors.senha_atual}</Text>}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nova Senha</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, errors.nova_senha && styles.inputError]}
                  value={formData.nova_senha}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, nova_senha: text }))}
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={20} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.nova_senha && <Text style={styles.errorText}>{errors.nova_senha}</Text>}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Nova Senha</Text>
              <TextInput
                style={[styles.input, errors.confirmar_senha && styles.inputError]}
                value={formData.confirmar_senha}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmar_senha: text }))}
                placeholder="Confirme a nova senha"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={true}
              />
              {errors.confirmar_senha && <Text style={styles.errorText}>{errors.confirmar_senha}</Text>}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Save size={20} color={colors.primaryForeground} />
                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {(loading || uploadingPhoto) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.water.primary} />
        </View>
      )}
    </View>
  );
};