/**
 * Serviços para gerenciar regras de alerta
 */

import { apiService, ApiResponse } from './api';

export interface RegraAlerta {
  id: number;
  dispositivo_id: number;
  parametro: string;
  condicao: string;
  valor: number;
  data_criacao: string;
  dispositivo: {
    nome: string;
    localizacao: string;
  };
}

export interface Parametro {
  codigo: string;
  nome: string;
  unidade: string;
  descricao: string;
}

export interface Condicao {
  codigo: string;
  nome: string;
  simbolo: string;
  descricao: string;
}

export interface CriarRegraData {
  usuario_id: number;
  dispositivo_id: number;
  parametro: string;
  condicao: string;
  valor: number;
}

export interface AtualizarRegraData {
  parametro?: string;
  condicao?: string;
  valor?: number;
}

class RegraAlertaService {
  /**
   * Lista regras de alerta do usuário
   */
  async listarRegras(usuarioId: number, dispositivoId?: number): Promise<ApiResponse<RegraAlerta[]>> {
    const params: any = { usuario_id: usuarioId };
    if (dispositivoId) {
      params.dispositivo_id = dispositivoId;
    }
    
    return apiService.get<RegraAlerta[]>('/alertas/regras.php', params);
  }

  /**
   * Cria nova regra de alerta
   */
  async criarRegra(dados: CriarRegraData): Promise<ApiResponse<{ id: number }>> {
    return apiService.post<{ id: number }>('/alertas/regras.php', dados);
  }

  /**
   * Atualiza regra existente
   */
  async atualizarRegra(regraId: number, dados: AtualizarRegraData): Promise<ApiResponse<void>> {
    return apiService.put<void>(`/alertas/regras.php?id=${regraId}`, dados);
  }

  /**
   * Remove regra
   */
  async removerRegra(regraId: number): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/alertas/regras.php?id=${regraId}`);
  }

  /**
   * Lista parâmetros disponíveis
   */
  async listarParametros(): Promise<ApiResponse<Parametro[]>> {
    return apiService.get<Parametro[]>('/alertas/regras.php', { acao: 'parametros' });
  }

  /**
   * Lista condições disponíveis
   */
  async listarCondicoes(): Promise<ApiResponse<Condicao[]>> {
    return apiService.get<Condicao[]>('/alertas/regras.php', { acao: 'condicoes' });
  }

  /**
   * Valida dados da regra
   */
  validarRegra(dados: CriarRegraData): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!dados.usuario_id || dados.usuario_id <= 0) {
      erros.push('ID do usuário é obrigatório');
    }

    if (!dados.dispositivo_id || dados.dispositivo_id <= 0) {
      erros.push('ID do dispositivo é obrigatório');
    }

    if (!dados.parametro || dados.parametro.trim() === '') {
      erros.push('Parâmetro é obrigatório');
    }

    if (!dados.condicao || dados.condicao.trim() === '') {
      erros.push('Condição é obrigatória');
    }

    if (dados.valor === undefined || dados.valor === null || isNaN(dados.valor)) {
      erros.push('Valor é obrigatório e deve ser um número');
    }

    if (dados.valor < 0) {
      erros.push('Valor deve ser positivo');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }

  /**
   * Formata valor para exibição
   */
  formatarValor(parametro: string, valor: number): string {
    const unidades: Record<string, string> = {
      temperatura: '°C',
      ph: '',
      turbidez: '%',
      condutividade: 'μS/cm'
    };

    const unidade = unidades[parametro] || '';
    return `${valor}${unidade}`;
  }

  /**
   * Formata condição para exibição
   */
  formatarCondicao(condicao: string): string {
    const simbolos: Record<string, string> = {
      maior_que: '>',
      menor_que: '<',
      igual_a: '=',
      diferente_de: '≠'
    };

    return simbolos[condicao] || condicao;
  }

  /**
   * Gera descrição da regra
   */
  gerarDescricaoRegra(regra: RegraAlerta): string {
    const parametros: Record<string, string> = {
      temperatura: 'Temperatura',
      ph: 'pH',
      turbidez: 'Turbidez',
      condutividade: 'Condutividade'
    };

    const parametroNome = parametros[regra.parametro] || regra.parametro;
    const simbolo = this.formatarCondicao(regra.condicao);
    const valorFormatado = this.formatarValor(regra.parametro, regra.valor);

    return `${parametroNome} ${simbolo} ${valorFormatado}`;
  }
}

export const regraAlertaService = new RegraAlertaService();
