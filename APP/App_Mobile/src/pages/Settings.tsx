import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Wifi,
  Moon,
  Sun,
  Settings as SettingsIcon
} from 'lucide-react-native';
import { MobileHeader } from '../components/MobileHeader';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const settingsSections = [
  {
    title: 'Conta',
    items: [
      {
        icon: 'User',
        title: 'Perfil',
        subtitle: 'Editar informações pessoais',
        route: 'Profile',
      },
      {
        icon: 'Bell',
        title: 'Notificações',
        subtitle: 'Ver alertas recebidos',
        route: 'Notifications',
      },
      {
        icon: 'Settings',
        title: 'Regras de Alerta',
        subtitle: 'Configurar alertas automáticos',
        route: 'AlertRules',
      },
    ],
  },
  {
    title: 'Suporte',
    items: [
      {
        icon: 'HelpCircle',
        title: 'Ajuda',
        subtitle: 'Central de ajuda',
        route: 'Help',
      },
      {
        icon: 'Shield',
        title: 'Privacidade',
        subtitle: 'Política de privacidade',
        route: 'Privacy',
      },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        icon: 'LogOut',
        title: 'Sair',
        subtitle: 'Fazer logout da conta',
        type: 'action',
        action: 'logout',
      },
    ],
  },
];

export const Settings: React.FC = () => {
  const navigation = useNavigation<any>();
  const { logout, user } = useAuth();
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
      marginBottom: spacing.xl,
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
    settingItem: {
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
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      backgroundColor: `${colors.water.primary}10`,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    textContainer: {
      flex: 1,
    },
    settingTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.medium,
      color: colors.foreground,
      marginBottom: spacing.xs,
    },
    settingSubtitle: {
      fontSize: typography.sizes.sm,
      color: colors.mutedForeground,
    },
    settingRight: {
      marginLeft: spacing.sm,
    },
  });
  const getIcon = (iconName: string) => {
    const iconProps = {
      size: 20,
      color: colors.water.primary,
    };

    switch (iconName) {
      case 'User':
        return <User {...iconProps} />;
      case 'Bell':
        return <Bell {...iconProps} />;
      case 'Shield':
        return <Shield {...iconProps} />;
      case 'HelpCircle':
        return <HelpCircle {...iconProps} />;
      case 'LogOut':
        return <LogOut {...iconProps} />;
      case 'Moon':
        return <Moon {...iconProps} />;
      case 'Sun':
        return <Sun {...iconProps} />;
      case 'Wifi':
        return <Wifi {...iconProps} />;
      case 'Settings':
        return <SettingsIcon {...iconProps} />;
      default:
        return <User {...iconProps} />;
    }
  };

  const handleItemPress = (item: any) => {
    if (item.route) {
      navigation.navigate(item.route);
    } else if (item.action === 'logout') {
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
    }
  };

  return (
    <View style={styles.container}>
      <MobileHeader userName={user?.name} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Configurações</Text>
          <Text style={styles.subtitle}>
            Gerencie suas preferências e configurações
          </Text>

          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.settingItem,
                      itemIndex === section.items.length - 1 && styles.lastItem,
                    ]}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.settingLeft}>
                      <View style={styles.iconContainer}>
                        {getIcon(item.icon)}
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={styles.settingTitle}>{item.title}</Text>
                        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                    <View style={styles.settingRight}>
                      <ChevronRight size={20} color={colors.mutedForeground} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// styles are memoized inside component based on theme
