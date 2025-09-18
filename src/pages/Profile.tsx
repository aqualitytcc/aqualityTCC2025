import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Edit, ChevronRight, User, Mail, Phone, MapPin, Calendar } from 'lucide-react-native';
import { MobileHeader } from '../components/MobileHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { useThemeMode } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { mode } = useThemeMode();

  const handleEditProfile = () => {
    Alert.alert('Editar Perfil', 'Funcionalidade em desenvolvimento');
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

  const profileSections = [
    {
      title: 'Informações Pessoais',
      items: [
        {
          icon: 'User',
          label: 'Nome Completo',
          value: user?.name || 'Rodinei Almirante Silva',
        },
        {
          icon: 'Mail',
          label: 'Email',
          value: user?.email || 'aquality@tcc.com',
        },
        {
          icon: 'Phone',
          label: 'Telefone',
          value: '+55 (11) 99999-9999',
        },
        {
          icon: 'MapPin',
          label: 'Localização',
          value: 'São Paulo, SP - Brasil',
        },
        {
          icon: 'Calendar',
          label: 'Membro desde',
          value: 'Janeiro 2024',
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
  }), [mode]);

  return (
    <View style={styles.container}>
      <MobileHeader userName={user?.name} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.profileCard}>
            <Image
              source={require('../assets/avatar-user.jpg')}
              style={styles.avatar}
            />
            <Text style={styles.name}>{user?.name || 'Rodinei Almirante Silva'}</Text>
            <Text style={styles.email}>{user?.email || 'aquality@tcc.com'}</Text>
            
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Edit size={16} color={colors.water.primary} />
              <Text style={styles.editButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Estatísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>3</Text>
                <Text style={styles.statLabel}>Dispositivos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>156</Text>
                <Text style={styles.statLabel}>Análises</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>12</Text>
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

    </View>
  );
};

// styles are memoized inside component based on theme
