import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Plus, Smartphone, Wifi, WifiOff, ChevronRight, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { MobileHeader } from '../components/MobileHeader';
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { useAuth } from '../contexts/AuthContext';
import { deviceService, Dispositivo } from '../services/deviceService';
import { handleApiError } from '../services/api';

const { width } = Dimensions.get('window');

export const Devices: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [devices, setDevices] = useState<Dispositivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [codigoDispositivo, setCodigoDispositivo] = useState('');
  const [conectandoDispositivo, setConectandoDispositivo] = useState(false);
  const pullProgress = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (user) {
      carregarDispositivos();
    }
  }, [user]);

  const carregarDispositivos = async () => {
    if (!user) return;
    
    try {
      const response = await deviceService.listarDispositivos(user.id);
      
      if (response.status === 'sucesso' && response.dados) {
        setDevices(response.dados);
      } else {
        console.error('Erro ao carregar dispositivos:', response.mensagem);
        Alert.alert('Erro', 'Não foi possível carregar os dispositivos.');
      }
    } catch (error) {
      console.error('Erro ao carregar dispositivos:', handleApiError(error));
      Alert.alert('Erro', 'Não foi possível carregar os dispositivos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await carregarDispositivos();
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    return status === 'online' ? (
      <Wifi size={16} color={colors.success} />
    ) : (
      <WifiOff size={16} color={colors.mutedForeground} />
    );
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? colors.success : colors.mutedForeground;
  };

  const handleDevicePress = (device: Dispositivo) => {
    // Use any to bypass navigation typing for now
    (navigation as any).navigate('SensorDetails', { device });
  };

  const handleAddDevice = () => {
    setShowAddModal(true);
    setCodigoDispositivo('');
  };

  const conectarDispositivo = async () => {
    if (!user?.id || !codigoDispositivo.trim()) {
      Alert.alert('Erro', 'Digite o código do dispositivo.');
      return;
    }

    try {
      setConectandoDispositivo(true);
      
      const response = await fetch('http://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/dispositivos/conectar.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: user.id,
          codigo_verificacao: codigoDispositivo.trim()
        })
      });

      const data = await response.json();
      
      if (data.status === 'sucesso') {
        Alert.alert(
          'Sucesso!', 
          `Dispositivo "${data.dados.dispositivo.nome}" conectado com sucesso!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowAddModal(false);
                carregarDispositivos(); // Recarrega a lista
              }
            }
          ]
        );
      } else {
        Alert.alert('Erro', data.mensagem || 'Erro ao conectar dispositivo.');
      }
    } catch (error) {
      console.error('Erro ao conectar dispositivo:', error);
      Alert.alert('Erro', 'Erro interno. Tente novamente.');
    } finally {
      setConectandoDispositivo(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MobileHeader userName={user?.name || 'Usuário'} />
        <Text style={styles.loadingText}>Carregando dispositivos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MobileHeader userName={user?.name || 'Usuário'} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            colors={[colors.water.primary]}
            tintColor={colors.water.primary}
            title="Atualizando dispositivos..."
            titleColor={colors.mutedForeground}
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Meus Dispositivos</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddDevice}>
              <Plus size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Gerencie seus sensores de qualidade da água
          </Text>

          {devices.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nenhum dispositivo encontrado</Text>
              <Text style={styles.emptyStateSubtext}>Adicione um dispositivo A-Quality para começar</Text>
            </View>
          ) : (
            <View style={styles.devicesList}>
              {devices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={styles.deviceCard}
                  onPress={() => handleDevicePress(device)}
                  activeOpacity={0.7}
                >
                  <View style={styles.deviceHeader}>
                    <View style={styles.deviceInfo}>
                      <View style={styles.deviceIcon}>
                        <Smartphone size={24} color={colors.water.primary} />
                      </View>
                      <View style={styles.deviceDetails}>
                        <Text style={styles.deviceName}>{device.nome}</Text>
                        <Text style={styles.deviceLocation}>{device.localizacao}</Text>
                      </View>
                    </View>
                    <View style={styles.statusContainer}>
                      {getStatusIcon(device.status)}
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(device.status) }
                      ]}>
                        {device.status === 'online' ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.deviceStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Última atualização</Text>
                      <Text style={styles.statValue}>{device.tempo_offline || 'Nunca'}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Bateria</Text>
                      <Text style={[
                        styles.statValue,
                        { color: 94 > 20 ? colors.success : colors.danger }
                      ]}>
                        94%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.batteryBar}>
                    <View 
                      style={[
                        styles.batteryFill,
                        { 
                          width: `94%`,
                          backgroundColor: 94 > 20 ? colors.success : colors.danger
                        }
                      ]} 
                    />
                  </View>

                  <View style={styles.deviceFooter}>
                    <Text style={styles.viewDetailsText}>Ver detalhes</Text>
                    <ChevronRight size={16} color={colors.water.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Modal para Adicionar Dispositivo */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Dispositivo</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <X size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Digite o código de verificação do seu dispositivo A-Quality:
            </Text>
            
            <TextInput
              style={styles.codeInput}
              value={codigoDispositivo}
              onChangeText={setCodigoDispositivo}
              placeholder="Ex: ESP-AQUALITY-01"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.connectButton, conectandoDispositivo && styles.disabledButton]}
                onPress={conectarDispositivo}
                disabled={conectandoDispositivo}
              >
                {conectandoDispositivo ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={styles.connectButtonText}>Conectar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.water.primary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    marginBottom: spacing.lg,
  },
  devicesList: {
    gap: spacing.md,
  },
  deviceCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    ...shadows.card,
    padding: spacing.md,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    backgroundColor: `${colors.water.primary}10`,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  deviceLocation: {
    fontSize: typography.sizes.sm,
    color: colors.mutedForeground,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.foreground,
  },
  batteryBar: {
    height: 4,
    backgroundColor: colors.muted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 2,
  },
  deviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewDetailsText: {
    fontSize: typography.sizes.sm,
    color: colors.water.primary,
    fontWeight: typography.weights.medium,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    marginTop: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.foreground,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalDescription: {
    fontSize: typography.sizes.md,
    color: colors.mutedForeground,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.foreground,
    backgroundColor: colors.background,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.muted,
  },
  cancelButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.mutedForeground,
  },
  connectButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.water.primary,
    ...shadows.button,
  },
  connectButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.primaryForeground,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
