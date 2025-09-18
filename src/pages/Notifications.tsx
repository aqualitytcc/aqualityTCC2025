import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Bell, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { MobileHeader } from '../components/MobileHeader';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { useThemeMode } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'success' | 'error' | 'info';
  time: string;
  read: boolean;
}

const notifications: Notification[] = [
  {
    id: '1',
    title: 'Alerta de Qualidade',
    message: 'Nível de condutividade acima do normal detectado no sensor Aquality01',
    type: 'warning',
    time: '2 min atrás',
    read: false,
  },
  {
    id: '2',
    title: 'Sensor Conectado',
    message: 'Dispositivo Casa02 foi reconectado com sucesso',
    type: 'success',
    time: '15 min atrás',
    read: false,
  },
  {
    id: '3',
    title: 'Bateria Baixa',
    message: 'Bateria do sensor Localização 03 está em 12%',
    type: 'error',
    time: '1 hora atrás',
    read: true,
  },
  {
    id: '4',
    title: 'Análise Completa',
    message: 'Nova análise de qualidade da água disponível',
    type: 'info',
    time: '2 horas atrás',
    read: true,
  },
  {
    id: '5',
    title: 'Manutenção Programada',
    message: 'Lembrete: Manutenção do sensor Aquality01 agendada para amanhã',
    type: 'info',
    time: '1 dia atrás',
    read: true,
  },
];

export const Notifications: React.FC = () => {
  const { mode } = useThemeMode();
  const getNotificationIcon = (type: string) => {
    const iconProps = { size: 20 };
    
    switch (type) {
      case 'warning':
        return <AlertTriangle {...iconProps} color={colors.warning} />;
      case 'success':
        return <CheckCircle {...iconProps} color={colors.success} />;
      case 'error':
        return <XCircle {...iconProps} color={colors.danger} />;
      case 'info':
        return <Bell {...iconProps} color={colors.water.primary} />;
      default:
        return <Bell {...iconProps} color={colors.mutedForeground} />;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return { backgroundColor: `${colors.warning}10`, borderLeftColor: colors.warning };
      case 'success':
        return { backgroundColor: `${colors.success}10`, borderLeftColor: colors.success };
      case 'error':
        return { backgroundColor: `${colors.danger}10`, borderLeftColor: colors.danger };
      case 'info':
        return { backgroundColor: `${colors.water.primary}10`, borderLeftColor: colors.water.primary };
      default:
        return { backgroundColor: colors.muted, borderLeftColor: colors.mutedForeground };
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.foreground,
    },
    badge: {
      backgroundColor: colors.danger,
      borderRadius: 12,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      minWidth: 24,
      alignItems: 'center',
    },
    badgeText: {
      color: colors.primaryForeground,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.bold,
    },
    subtitle: {
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
      marginBottom: spacing.lg,
    },
    notificationsList: {
      gap: spacing.sm,
    },
    notificationCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderLeftWidth: 4,
      ...shadows.card,
      position: 'relative',
    },
    unreadCard: {
      borderWidth: 1,
      borderColor: colors.water.primary,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    notificationIcon: {
      marginRight: spacing.sm,
      marginTop: 2,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      marginBottom: spacing.xs,
      flexWrap: 'wrap',
    },
    unreadTitle: {
      fontWeight: typography.weights.bold,
    },
    notificationMessage: {
      fontSize: typography.sizes.sm,
      color: colors.mutedForeground,
      lineHeight: 20,
      flexWrap: 'wrap',
    },
    notificationTime: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    timeText: {
      fontSize: typography.sizes.xs,
      color: colors.mutedForeground,
      marginLeft: spacing.xs,
    },
    unreadDot: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.water.primary,
    },
  }), [mode]);

  return (
    <View style={styles.container}>
      <MobileHeader userName="Rodinei Almirante Silva" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Notificações</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.subtitle}>
            {unreadCount > 0 
              ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Todas as notificações foram lidas'
            }
          </Text>

          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  getNotificationStyle(notification.type),
                  !notification.read && styles.unreadCard,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={[
                      styles.notificationTitle,
                      !notification.read && styles.unreadTitle
                    ]}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <View style={styles.notificationTime}>
                      <Clock size={12} color={colors.mutedForeground} />
                      <Text style={styles.timeText}>{notification.time}</Text>
                    </View>
                  </View>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

    </View>
  );
};

// styles are memoized inside component based on theme
