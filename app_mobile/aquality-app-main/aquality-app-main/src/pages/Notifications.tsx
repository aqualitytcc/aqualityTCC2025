import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { Bell, AlertTriangle, CheckCircle, XCircle, Clock, Settings, Plus } from 'lucide-react-native';
import { MobileHeader } from '../components/MobileHeader';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { useThemeMode } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { alertService, AlertasResponse } from '../services/alertService';
import { useNotifications } from '../services/notificationService';

const { width } = Dimensions.get('window');

interface Alerta {
  id: number;
  tipo: string;
  nivel: 'info' | 'warning' | 'critical';
  titulo: string;
  mensagem: string;
  valores: {
    atual?: number;
    limite?: number;
  };
  dispositivo: {
    nome: string;
    localizacao: string;
  };
  status: {
    lido: boolean;
    resolvido: boolean;
  };
  datas: {
    criacao: string;
    resolucao?: string;
    tempo_decorrido: string;
  };
}

export const Notifications: React.FC = () => {
  const { mode } = useThemeMode();
  const { user } = useAuth();
  const { isInitialized, badgeCount, clearBadge } = useNotifications();
  
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contadores, setContadores] = useState({
    total: 0,
    nao_lidos: 0,
    nao_resolvidos: 0
  });

  // Carregar alertas
  const carregarAlertas = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await alertService.listarAlertas({
        usuario_id: user.id,
        limit: 50
      });
      
      if (response.status === 'sucesso' && response.dados) {
        setAlertas(response.dados.alertas);
        setContadores(response.dados.contadores);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      Alert.alert('Erro', 'Não foi possível carregar os alertas');
    } finally {
      setLoading(false);
    }
  };

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await carregarAlertas();
    setRefreshing(false);
  };

  // Marcar como lido
  const marcarComoLido = async (alertaId: number) => {
    try {
      await alertService.marcarComoLido(alertaId);
      await carregarAlertas();
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  // Marcar todos como lidos
  const marcarTodosComoLidos = async () => {
    if (!user?.id) return;
    
    try {
      await alertService.marcarTodosComoLidos(user.id);
      await carregarAlertas();
      await clearBadge();
    } catch (error) {
      console.error('Erro ao marcar todos como lidos:', error);
    }
  };

  // Simular novo alerta (para testes)
  const simularAlerta = async () => {
    if (!user?.id) return;
    
    try {
      await alertService.simularNovoAlerta(user.id);
      await carregarAlertas();
    } catch (error) {
      console.error('Erro ao simular alerta:', error);
    }
  };

  useEffect(() => {
    carregarAlertas();
  }, [user?.id]);

  const getNotificationIcon = (nivel: string) => {
    const iconProps = { size: 20 };
    
    switch (nivel) {
      case 'critical':
        return <XCircle {...iconProps} color={colors.danger} />;
      case 'warning':
        return <AlertTriangle {...iconProps} color={colors.warning} />;
      case 'info':
      default:
        return <Bell {...iconProps} color={colors.water.primary} />;
    }
  };

  const getNotificationStyle = (nivel: string) => {
    switch (nivel) {
      case 'critical':
        return { backgroundColor: `${colors.danger}10`, borderLeftColor: colors.danger };
      case 'warning':
        return { backgroundColor: `${colors.warning}10`, borderLeftColor: colors.warning };
      case 'info':
      default:
        return { backgroundColor: `${colors.water.primary}10`, borderLeftColor: colors.water.primary };
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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    actionButton: {
      backgroundColor: colors.water.primary + '20',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    actionButtonText: {
      fontSize: typography.sizes.sm,
      color: colors.water.primary,
      fontWeight: typography.weights.medium,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      ...shadows.card,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.foreground,
    },
    statLabel: {
      fontSize: typography.sizes.sm,
      color: colors.mutedForeground,
      marginTop: spacing.xs,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    loadingText: {
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    emptyMessage: {
      fontSize: typography.sizes.md,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 24,
    },
    valoresText: {
      fontSize: typography.sizes.sm,
      color: colors.mutedForeground,
      marginTop: spacing.xs,
      fontStyle: 'italic',
    },
    dispositivoText: {
      fontSize: typography.sizes.xs,
      color: colors.mutedForeground,
      marginLeft: spacing.xs,
    },
  }), [mode]);

  return (
    <View style={styles.container}>
      <MobileHeader userName={user?.name} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.water.primary]}
            tintColor={colors.water.primary}
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Alertas</Text>
            <View style={styles.headerActions}>
              {contadores.nao_lidos > 0 && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={marcarTodosComoLidos}
                >
                  <Text style={styles.actionButtonText}>Marcar todos como lidos</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={simularAlerta}
              >
                <Plus size={16} color={colors.water.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{contadores.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.warning }]}>{contadores.nao_lidos}</Text>
              <Text style={styles.statLabel}>Não lidos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.danger }]}>{contadores.nao_resolvidos}</Text>
              <Text style={styles.statLabel}>Não resolvidos</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando alertas...</Text>
            </View>
          ) : alertas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Nenhum alerta</Text>
              <Text style={styles.emptyMessage}>
                Você não possui alertas no momento. Configure regras de alerta para receber notificações.
              </Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {alertas.map((alerta) => (
                <TouchableOpacity
                  key={alerta.id}
                  style={[
                    styles.notificationCard,
                    getNotificationStyle(alerta.nivel),
                    !alerta.status.lido && styles.unreadCard,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => marcarComoLido(alerta.id)}
                >
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationIcon}>
                      {getNotificationIcon(alerta.nivel)}
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={[
                        styles.notificationTitle,
                        !alerta.status.lido && styles.unreadTitle
                      ]}>
                        {alerta.titulo}
                      </Text>
                      <Text style={styles.notificationMessage}>
                        {alerta.mensagem}
                      </Text>
                      {alerta.valores.atual && (
                        <Text style={styles.valoresText}>
                          Valor atual: {alerta.valores.atual} | Limite: {alerta.valores.limite}
                        </Text>
                      )}
                      <View style={styles.notificationTime}>
                        <Clock size={12} color={colors.mutedForeground} />
                        <Text style={styles.timeText}>{alerta.datas.tempo_decorrido}</Text>
                        <Text style={styles.dispositivoText}>• {alerta.dispositivo.nome}</Text>
                      </View>
                    </View>
                  </View>
                  {!alerta.status.lido && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// styles are memoized inside component based on theme
