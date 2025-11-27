/**
 * Serviços para dados dos sensores
 */

import { apiService, ApiResponse, LeituraHistorico, EstatisticasDispositivo } from './api';

export interface BuscarHistoricoParams {
  usuario_id: number;
  dispositivo_id: number;
  limit?: number;
  offset?: number;
  data_inicio?: string;
  data_fim?: string;
}

export interface HistoricoResponse {
  historico: LeituraHistorico[];
  paginacao: {
    total: number;
    limit: number;
    offset: number;
    tem_mais: boolean;
  };
}

export interface BuscarEstatisticasParams {
  usuario_id: number;
  dispositivo_id?: number;
  data_inicio?: string;
  data_fim?: string;
}

class SensorService {
  /**
   * Busca histórico de leituras de um dispositivo
   */
  async buscarHistorico(params: BuscarHistoricoParams): Promise<ApiResponse<HistoricoResponse>> {
    return apiService.get<HistoricoResponse>('/sensores/buscar_dados.php', {
      ...params,
      tipo: 'historico'
    });
  }

  /**
   * Busca estatísticas dos sensores
   */
  async buscarEstatisticas(params: BuscarEstatisticasParams): Promise<ApiResponse<EstatisticasDispositivo[]>> {
    return apiService.get<EstatisticasDispositivo[]>('/sensores/buscar_dados.php', {
      ...params,
      tipo: 'estatisticas'
    });
  }

  /**
   * Envia dados do sensor (usado principalmente para testes)
   */
  async enviarDadosSensor(dadosSensor: {
    codigo_dispositivo: string;
    ph: number;
    turbidez: number;
    condutividade: number;
    temperatura: number;
    bateria?: number;
    sinal?: number;
    timestamp?: string;
  }): Promise<ApiResponse<{ leitura_id: number; dispositivo: string; timestamp: string }>> {
    return apiService.post<{ leitura_id: number; dispositivo: string; timestamp: string }>('/sensores/receber_dados.php', dadosSensor);
  }

  /**
   * Busca dados de um período específico para gráficos
   */
  async buscarDadosGrafico(
    usuarioId: number, 
    dispositivoId: number, 
    dataInicio: string, 
    dataFim: string, 
    intervalo: number = 24
  ): Promise<ApiResponse<HistoricoResponse>> {
    return this.buscarHistorico({
      usuario_id: usuarioId,
      dispositivo_id: dispositivoId,
      data_inicio: dataInicio,
      data_fim: dataFim,
      limit: intervalo
    });
  }

  /**
   * Busca última leitura de um dispositivo específico
   */
  async buscarUltimaLeitura(usuarioId: number, dispositivoId: number): Promise<ApiResponse<any>> {
    return apiService.get('/sensores/buscar_dados.php', {
      usuario_id: usuarioId,
      dispositivo_id: dispositivoId,
      tipo: 'ultimas',
      limit: 1
    });
  }
}

export const sensorService = new SensorService();