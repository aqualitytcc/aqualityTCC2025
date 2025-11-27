/**
 * Configuração da API e serviços HTTP
 * Centraliza todas as requisições para o backend
 */

// Configure com sua URL base de produção
const API_BASE_URL = 'http://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile';

// Configuração de timeout e outros parâmetros
const DEFAULT_TIMEOUT = 15000; // 15 segundos para conexão remota

export interface ApiResponse<T = any> {
  status: 'sucesso' | 'erro';
  mensagem: string;
  dados?: T;
  timestamp: string;
}

export interface ApiError {
  status: 'erro';
  mensagem: string;
  codigo?: number;
}

/**
 * Classe para gerenciar requisições HTTP
 */
class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Método genérico para fazer requisições
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      
      console.log(`📡 API Response: ${response.status}`, data);

      if (!response.ok) {
        throw new Error(data.mensagem || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout: A requisição demorou muito para responder');
        }
        throw new Error(error.message);
      }
      
      throw new Error('Erro desconhecido na requisição');
    }
  }

  /**
   * Método GET
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * Método POST
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Método PUT
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Método DELETE
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Instância global do serviço
export const apiService = new ApiService();

/**
 * Hook para lidar com erros de API de forma consistente
 */
export const handleApiError = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'Erro inesperado. Tente novamente.';
};

/**
 * Tipos para as respostas da API
 */
export interface Usuario {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
}

export interface Dispositivo {
  id: number;
  nome: string;
  codigo_dispositivo: string;
  localizacao: string;
  descricao?: string;
  coordenadas: {
    latitude?: number;
    longitude?: number;
  };
  status: 'online' | 'offline' | 'manutencao';
  nivel_bateria: number;
  versao_firmware?: string;
  estatisticas: {
    total_leituras: number;
    ultima_leitura?: string;
    tempo_offline?: string;
  };
  datas: {
    criacao: string;
    atualizacao: string;
    ultima_comunicacao?: string;
  };
  leitura_atual?: LeituraAtual;
}

export interface LeituraAtual {
  ph: ParametroLeitura;
  turbidez: ParametroLeitura;
  condutividade: ParametroLeitura;
  temperatura: ParametroLeitura;
  timestamp: string;
  qualidade_sinal?: number;
}

export interface ParametroLeitura {
  valor: number;
  status: 'normal' | 'warning' | 'danger' | 'unknown';
  unidade: string;
}

export interface LeituraHistorico {
  id: number;
  ph: number;
  turbidez: number;
  condutividade: number;
  temperatura: number;
  timestamp: string;
  qualidade_sinal?: number;
  observacoes?: string;
}

export interface Alerta {
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

export interface EstatisticasDispositivo {
  dispositivo_id: number;
  dispositivo_nome: string;
  total_leituras: number;
  periodo: {
    inicio?: string;
    fim?: string;
  };
  ph: EstatisticaParametro;
  turbidez: EstatisticaParametro;
  condutividade: EstatisticaParametro;
  temperatura: EstatisticaParametro;
}

export interface EstatisticaParametro {
  medio?: number;
  minimo?: number;
  maximo?: number;
}