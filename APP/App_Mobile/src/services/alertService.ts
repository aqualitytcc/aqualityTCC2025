/**
 * Serviços para alertas e notificações
 */

import { apiService, ApiResponse, Alerta } from './api';
import { notificationService } from './notificationService';

export interface ListarAlertasParams {
  usuario_id: number;
  apenas_nao_lidos?: boolean;
  limit?: number;
  offset?: number;
}

export interface AlertasResponse {
  alertas: Alerta[];
  contadores: {
    total: number;
    nao_lidos: number;
    nao_resolvidos: number;
  };
  paginacao: {
    limit: number;
    offset: number;
    tem_mais: boolean;
  };
}

export interface AtualizarAlertaData {
  lido?: boolean;
  resolvido?: boolean;
}

class AlertService {
  /**
   * Lista alertas do usuário
   */
  async listarAlertas(params: ListarAlertasParams): Promise<ApiResponse<AlertasResponse>> {
    return apiService.get<AlertasResponse>('/alertas/gerenciar_simples.php', {
      ...params,
      apenas_nao_lidos: params.apenas_nao_lidos ? 'true' : 'false'
    });
  }

  /**
   * Marca alerta como lido
   */
  async marcarComoLido(alertaId: number): Promise<ApiResponse<void>> {
    return apiService.put<void>(`/alertas/gerenciar_simples.php?id=${alertaId}`, {
      lido: true
    });
  }

  /**
   * Marca alerta como resolvido
   */
  async marcarComoResolvido(alertaId: number): Promise<ApiResponse<void>> {
    return apiService.put<void>(`/alertas/gerenciar.php?id=${alertaId}`, {
      resolvido: true
    });
  }

  /**
   * Atualiza status do alerta
   */
  async atualizarAlerta(alertaId: number, data: AtualizarAlertaData): Promise<ApiResponse<void>> {
    return apiService.put<void>(`/alertas/gerenciar.php?id=${alertaId}`, data);
  }

  /**
   * Busca apenas alertas não lidos
   */
  async buscarAlertasNaoLidos(usuarioId: number): Promise<ApiResponse<AlertasResponse>> {
    return this.listarAlertas({
      usuario_id: usuarioId,
      apenas_nao_lidos: true,
      limit: 50
    });
  }

  /**
   * Busca contadores de alertas
   */
  async buscarContadores(usuarioId: number): Promise<ApiResponse<{ total: number; nao_lidos: number; nao_resolvidos: number }>> {
    const response = await this.listarAlertas({
      usuario_id: usuarioId,
      limit: 1 // Só precisamos dos contadores
    });

    if (response.status === 'sucesso' && response.dados) {
      return {
        status: 'sucesso',
        mensagem: 'Contadores obtidos com sucesso',
        dados: response.dados.contadores,
        timestamp: response.timestamp
      };
    }

    return response as any;
  }

  /**
   * Marca todos os alertas como lidos
   */
  async marcarTodosComoLidos(usuarioId: number): Promise<ApiResponse<void>> {
    try {
      return await apiService.post<void>('/alertas/gerenciar_simples.php', {
        acao: 'marcar_todos_lidos',
        usuario_id: usuarioId
      });
    } catch (error) {
      console.error('Erro ao marcar todos como lidos:', error);
      throw error;
    }
  }

  /**
   * Simula recebimento de novo alerta (para testes)
   */
  async simularNovoAlerta(usuarioId: number): Promise<void> {
    try {
      // Criar alerta de exemplo diretamente no banco
      const response = await fetch(
        'http://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/criar_alerta_exemplo.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usuario_id: usuarioId,
            acao: 'criar_alerta_exemplo'
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Erro ao simular alerta');
      }
      
      const result = await response.json();
      console.log('Alerta de teste criado:', result);
      
    } catch (error) {
      console.error('Erro ao simular alerta:', error);
      // Fallback: criar alerta local para teste
      await notificationService.sendAlertNotification({
        titulo: 'Alerta de Teste',
        mensagem: 'Este é um alerta de teste para verificar o sistema',
        nivel: 'warning',
        dispositivo: 'Teste'
      });
    }
  }
}

export const alertService = new AlertService();