import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  Zap,
  Trash2,
  Edit
} from 'lucide-react-native';
import { MobileHeader } from '../components/MobileHeader';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { useThemeMode } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { regraAlertaService, RegraAlerta, Parametro, Condicao } from '../services/regraAlertaService';
import { deviceService } from '../services/deviceService';

const { width } = Dimensions.get('window');

export const AlertRules: React.FC = () => {
  const { mode } = useThemeMode();
  const { user } = useAuth();
  
  const [regras, setRegras] = useState<RegraAlerta[]>([]);
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [condicoes, setCondicoes] = useState<Condicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRegra, setEditingRegra] = useState<RegraAlerta | null>(null);
  
  // Formulário
  const [formData, setFormData] = useState({
    dispositivo_id: '',
    parametro: '',
    condicao: '',
    valor: '',
  });

  // Carregar dados
  const carregarDados = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const [regrasResponse, dispositivosResponse, parametrosResponse, condicoesResponse] = await Promise.all([
        regraAlertaService.listarRegras(user.id),
        deviceService.listarDispositivos(user.id),
        regraAlertaService.listarParametros(),
        regraAlertaService.listarCondicoes(),
      ]);
      
      if (regrasResponse.status === 'sucesso' && regrasResponse.dados) {
        setRegras(regrasResponse.dados);
      }
      
      if (dispositivosResponse.status === 'sucesso' && dispositivosResponse.dados) {
        setDispositivos(dispositivosResponse.dados);
      }
      
      if (parametrosResponse.status === 'sucesso' && parametrosResponse.dados) {
        setParametros(parametrosResponse.dados);
      }
      
      if (condicoesResponse.status === 'sucesso' && condicoesResponse.dados) {
        setCondicoes(condicoesResponse.dados);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  // Salvar regra
  const salvarRegra = async () => {
    if (!user?.id) return;
    
    try {
      const dados = {
        usuario_id: user.id,
        dispositivo_id: parseInt(formData.dispositivo_id),
        parametro: formData.parametro,
        condicao: formData.condicao,
        valor: parseFloat(formData.valor),
      };
      
      const validacao = regraAlertaService.validarRegra(dados);
      if (!validacao.valido) {
        Alert.alert('Erro', validacao.erros.join('\n'));
        return;
      }
      
      let response;
      if (editingRegra) {
        response = await regraAlertaService.atualizarRegra(editingRegra.id, {
          parametro: dados.parametro,
          condicao: dados.condicao,
          valor: dados.valor,
        });
      } else {
        response = await regraAlertaService.criarRegra(dados);
      }
      
      if (response.status === 'sucesso') {
        Alert.alert('Sucesso', 'Regra salva com sucesso');
        setShowModal(false);
        setEditingRegra(null);
        resetForm();
        carregarDados();
      } else {
        Alert.alert('Erro', response.mensagem);
      }
    } catch (error) {
      console.error('Erro ao salvar regra:', error);
      Alert.alert('Erro', 'Não foi possível salvar a regra');
    }
  };

  // Remover regra
  const removerRegra = async (regraId: number) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja remover esta regra?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await regraAlertaService.removerRegra(regraId);
              if (response.status === 'sucesso') {
                Alert.alert('Sucesso', 'Regra removida com sucesso');
                carregarDados();
              } else {
                Alert.alert('Erro', response.mensagem);
              }
            } catch (error) {
              console.error('Erro ao remover regra:', error);
              Alert.alert('Erro', 'Não foi possível remover a regra');
            }
          },
        },
      ]
    );
  };

  // Editar regra
  const editarRegra = (regra: RegraAlerta) => {
    setEditingRegra(regra);
    setFormData({
      dispositivo_id: regra.dispositivo_id.toString(),
      parametro: regra.parametro,
      condicao: regra.condicao,
      valor: regra.valor.toString(),
    });
    setShowModal(true);
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      dispositivo_id: '',
      parametro: '',
      condicao: '',
      valor: '',
    });
  };

  // Abrir modal para nova regra
  const novaRegra = () => {
    setEditingRegra(null);
    resetForm();
    setShowModal(true);
  };

  // Obter ícone do parâmetro
  const getParametroIcon = (parametro: string) => {
    const iconProps = { size: 20, color: colors.water.primary };
    
    switch (parametro) {
      case 'temperatura':
        return <Thermometer {...iconProps} />;
      case 'ph':
        return <Droplets {...iconProps} />;
      case 'turbidez':
        return <AlertTriangle {...iconProps} />;
      case 'condutividade':
        return <Zap {...iconProps} />;
      default:
        return <Settings {...iconProps} />;
    }
  };

  useEffect(() => {
    carregarDados();
  }, [user?.id]);

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
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.foreground,
    },
    addButton: {
      backgroundColor: colors.water.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    addButtonText: {
      color: colors.primaryForeground,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    regrasList: {
      gap: spacing.sm,
    },
    regraCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.card,
    },
    regraHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    regraInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    regraIcon: {
      marginRight: spacing.sm,
    },
    regraTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.foreground,
      flex: 1,
    },
    regraActions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    actionButton: {
      padding: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    regraDescription: {
      fontSize: typography.sizes.sm,
      color: colors.mutedForeground,
      marginBottom: spacing.xs,
    },
    regraDetails: {
      fontSize: typography.sizes.xs,
      color: colors.mutedForeground,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      width: width * 0.9,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.foreground,
    },
    formGroup: {
      marginBottom: spacing.md,
    },
    formLabel: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.foreground,
      marginBottom: spacing.xs,
    },
    formInput: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: typography.sizes.md,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formSelect: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.muted,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.mutedForeground,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.medium,
    },
    saveButton: {
      flex: 1,
      backgroundColor: colors.water.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    saveButtonText: {
      color: colors.primaryForeground,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.medium,
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
          <View style={styles.header}>
            <Text style={styles.title}>Regras de Alerta</Text>
            <TouchableOpacity style={styles.addButton} onPress={novaRegra}>
              <Plus size={16} color={colors.primaryForeground} />
              <Text style={styles.addButtonText}>Nova Regra</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyMessage}>Carregando regras...</Text>
            </View>
          ) : regras.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Settings size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Nenhuma regra configurada</Text>
              <Text style={styles.emptyMessage}>
                Configure regras de alerta para monitorar a qualidade da água e receber notificações automáticas.
              </Text>
            </View>
          ) : (
            <View style={styles.regrasList}>
              {regras.map((regra) => (
                <View key={regra.id} style={styles.regraCard}>
                  <View style={styles.regraHeader}>
                    <View style={styles.regraInfo}>
                      <View style={styles.regraIcon}>
                        {getParametroIcon(regra.parametro)}
                      </View>
                      <Text style={styles.regraTitle}>
                        {regraAlertaService.gerarDescricaoRegra(regra)}
                      </Text>
                    </View>
                    <View style={styles.regraActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => editarRegra(regra)}
                      >
                        <Edit size={16} color={colors.water.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => removerRegra(regra.id)}
                      >
                        <Trash2 size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.regraDescription}>
                    Dispositivo: {regra.dispositivo.nome}
                  </Text>
                  <Text style={styles.regraDetails}>
                    Criada em: {new Date(regra.data_criacao).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal para criar/editar regra */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRegra ? 'Editar Regra' : 'Nova Regra'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ fontSize: 24, color: colors.mutedForeground }}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Dispositivo</Text>
              <View style={styles.formSelect}>
                <Text style={styles.formInput}>
                  {dispositivos.find(d => d.id.toString() === formData.dispositivo_id)?.nome || 'Selecione um dispositivo'}
                </Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Parâmetro</Text>
              <View style={styles.formSelect}>
                <Text style={styles.formInput}>
                  {parametros.find(p => p.codigo === formData.parametro)?.nome || 'Selecione um parâmetro'}
                </Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Condição</Text>
              <View style={styles.formSelect}>
                <Text style={styles.formInput}>
                  {condicoes.find(c => c.codigo === formData.condicao)?.nome || 'Selecione uma condição'}
                </Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Valor Limite</Text>
              <TextInput
                style={styles.formInput}
                value={formData.valor}
                onChangeText={(text) => setFormData({ ...formData, valor: text })}
                placeholder="Digite o valor limite"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={salvarRegra}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
