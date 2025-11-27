import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Edit, ChevronRight, User, Mail, Phone, MapPin, Calendar, Lock } from 'lucide-react-native';
import { MobileHeader } from '../components/MobileHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { useThemeMode } from '../contexts/ThemeContext';
import { profileService, ProfileData } from '../services/profileService';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { mode } = useThemeMode();
  const navigation = useNavigation<any>();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    }
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando dados do perfil...');
      const response = await profileService.getUserProfile(user.id);
      
      if (response.status === 'sucesso' && response.dados) {
        setProfileData(response.dados);
        console.log('✅ Dados do perfil carregados:', response.dados);
      } else {
        throw new Error(response.mensagem || 'Erro ao carregar dados do perfil');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar perfil:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { profileData });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  // Usa dados reais quando disponíveis, senão fallback para dados do contexto
  const displayData = profileData || {
    usuario: {
      id: user?.id || 0,
      nome: user?.name || '',
      sobrenome: user?.sobrenome || '',
      nome_completo: user?.name || 'Usuário não identificado',
      email: user?.email || 'aquality@tcc.com',
      foto_perfil: undefined,
      data_criacao: new Date().toISOString(),
      membro_desde: 'Janeiro 2024'
    },
    estatisticas: {
      total_dispositivos: 0,
      total_analises: 0,
      total_alertas: 0
    },
    localizacao: 'São Paulo, SP - Brasil'
  };

  const profileSections = [
    {
      title: 'Informações Pessoais',
      items: [
        {
          icon: 'User',
          label: 'Nome Completo',
          value: displayData.usuario.nome_completo,
          editable: true
        },
        {
          icon: 'Mail',
          label: 'Email',
          value: displayData.usuario.email,
          editable: true
        },
        {
          icon: 'Lock',
          label: 'Alterar Senha',
          value: '••••••••',
          editable: true
        },
      ],
    },
  ];

  const getIcon = (iconName: string) => {
    const iconProps = { size: 20, color: colors.water.primary };
    
    switch (iconName) {
      case 'User':
        return <User {...iconProps} />;
      case 'Mail':
        return <Mail {...iconProps} />;
      case 'Phone':
        return <Phone {...iconProps} />;
      case 'MapPin':
        return <MapPin {...iconProps} />;
      case 'Calendar':
        return <Calendar {...iconProps} />;
      case 'Lock':
        return <Lock {...iconProps} />;
      default:
        return <User {...iconProps} />;
    }
  };

  const styles = React.useMemo(() => StyleSheet.create({
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
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      ...shadows.card,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: spacing.md,
    },
    name: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.foreground,
      marginBottom: spacing.xs,
    },
    email: {
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
      marginBottom: spacing.lg,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${colors.water.primary}10`,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    editButtonText: {
      color: colors.water.primary,
      fontWeight: typography.weights.medium,
      marginLeft: spacing.xs,
    },
    statsCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      ...shadows.card,
      padding: spacing.lg,
    },
    statsTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      marginBottom: spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: colors.water.primary,
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: typography.sizes.sm,
      color: colors.mutedForeground,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    sectionContent: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.xl,
      ...shadows.card,
      overflow: 'hidden',
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lastItem: {
      borderBottomWidth: 0,
    },
    infoLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    infoIcon: {
      width: 40,
      height: 40,
      backgroundColor: `${colors.water.primary}10`,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    infoText: {
      flex: 1,
    },
    infoLabel: {
      fontSize: typography.sizes.sm,
      color: colors.mutedForeground,
      marginBottom: spacing.xs,
    },
    infoValue: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.medium,
      color: colors.foreground,
    },
    logoutButton: {
      backgroundColor: colors.danger,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      marginTop: spacing.lg,
      ...shadows.button,
    },
    logoutButtonText: {
      color: colors.primaryForeground,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 200,
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
    },
    errorContainer: {
      backgroundColor: colors.danger + '10',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.danger,
    },
    errorText: {
      color: colors.danger,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
    },
    retryButton: {
      marginTop: spacing.sm,
      paddingVertical: spacing.xs,
    },
    retryButtonText: {
      color: colors.water.primary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.water.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    avatarInitials: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: colors.primaryForeground,
    },
  }), [mode]);

  return (
    <View style={styles.container}>
      <MobileHeader userName={user?.name} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.water.primary} />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={[colors.water.primary]}
              tintColor={colors.water.primary}
              title="Atualizando perfil..."
              titleColor={colors.mutedForeground}
            />
          }
        >
          <View style={styles.content}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                  <Text style={styles.retryButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.profileCard}>
              {profileData?.usuario.foto_perfil ? (
                <Image
                  source={{ uri: profileService.getAvatarUrl(profileData.usuario.foto_perfil) || undefined }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {profileService.getInitials(displayData.usuario.nome_completo)}
                  </Text>
                </View>
              )}
              <Text style={styles.name}>{displayData.usuario.nome_completo}</Text>
              <Text style={styles.email}>{displayData.usuario.email}</Text>
              
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Edit size={16} color={colors.water.primary} />
                <Text style={styles.editButtonText}>Editar Perfil</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Estatísticas</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{displayData.estatisticas.total_dispositivos}</Text>
                  <Text style={styles.statLabel}>Dispositivos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{displayData.estatisticas.total_analises}</Text>
                  <Text style={styles.statLabel}>Análises</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{displayData.estatisticas.total_alertas}</Text>
                  <Text style={styles.statLabel}>Alertas</Text>
                </View>
              </View>
            </View>

            {profileSections.map((section, sectionIndex) => (
              <View key={sectionIndex} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionContent}>
                  {section.items.map((item, itemIndex) => (
                    <View
                      key={itemIndex}
                      style={[
                        styles.infoItem,
                        itemIndex === section.items.length - 1 && styles.lastItem,
                      ]}
                    >
                      <View style={styles.infoLeft}>
                        <View style={styles.infoIcon}>
                          {getIcon(item.icon)}
                        </View>
                        <View style={styles.infoText}>
                          <Text style={styles.infoLabel}>{item.label}</Text>
                          <Text style={styles.infoValue}>{item.value}</Text>
                        </View>
                      </View>
                      <ChevronRight size={16} color={colors.mutedForeground} />
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Sair da Conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

// styles are memoized inside component based on theme
