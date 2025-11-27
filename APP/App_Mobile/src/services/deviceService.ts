import { apiService, ApiResponse } from './api';

export interface Dispositivo {
  id: number;
  nome: string;
  codigo_verificacao: string;
  localizacao: string;
  status: 'online' | 'offline';
  nivel_bateria: number;
  data_criacao: string;
  total_leituras: number;
  ultima_leitura?: {
    data_hora: string;
    temperatura: number;
    ph: number;
    turbidez: number;
    condutividade: number;
  };
  estatisticas: {
    tempo_offline: string;
  };
}

export interface DispositivosResponse extends ApiResponse {
  dados?: {
    dispositivos: Dispositivo[];
    total_dispositivos: number;
    resumo: {
      total_dispositivos: number;
      total_leituras: number;
    };
  };
}

export interface ConectarDispositivoData {
  usuario_id: number;
  codigo_verificacao: string;
}

export interface ConectarDispositivoResponse extends ApiResponse {
  dados?: {
    dispositivo: {
      id: number;
      nome: string;
      codigo_verificacao: string;
      localizacao: string;
      usuario_id: number;
      total_leituras: number;
    };
    mensagem_sucesso: string;
  };
}

class DeviceService {
  /**
   * Lista todos os dispositivos do usuário
   */
  async listarDispositivos(userId: number): Promise<{ status: string; dados?: Dispositivo[]; mensagem?: string }> {
    try {
      console.log('📱 Listando dispositivos do usuário:', userId);
      
      const response = await fetch(
        `http://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/dispositivos/listar.php?usuario_id=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      console.log('📱 Resposta da listagem:', data);
      
      if (data.status === 'sucesso' && data.dados) {
        // Mapeia os dados para o formato esperado pela UI
        const dispositivos: Dispositivo[] = data.dados.dispositivos.map((disp: any) => ({
          id: disp.id,
          nome: disp.nome,
          codigo_verificacao: disp.codigo_verificacao,
          localizacao: disp.localizacao,
          status: disp.total_leituras > 0 ? 'online' : 'offline',
          nivel_bateria: 94, // Valor fixo ilustrativo
          data_criacao: disp.data_criacao,
          total_leituras: disp.total_leituras,
          ultima_leitura: disp.ultima_leitura,
          estatisticas: {
            tempo_offline: disp.ultima_leitura ? 
              this.formatarTempoRelativo(disp.ultima_leitura.data_hora) : 
              'Nunca'
          }
        }));
        
        return {
          status: 'sucesso',
          dados: dispositivos
        };
      }
      
      return {
        status: 'erro',
        mensagem: data.mensagem || 'Erro ao listar dispositivos'
      };
    } catch (error) {
      console.error('❌ Erro ao listar dispositivos:', error);
      return {
        status: 'erro',
        mensagem: 'Erro de conexão'
      };
    }
  }

  /**
   * Conecta um dispositivo usando código de verificação
   */
  async conectarDispositivo(data: ConectarDispositivoData): Promise<ConectarDispositivoResponse> {
    try {
      console.log('🔗 Conectando dispositivo:', data);
      
      const response = await fetch(
        'http://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/dispositivos/conectar.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
      
      const result = await response.json();
      
      console.log('🔗 Resposta da conexão:', result);
      
      return result as ConectarDispositivoResponse;
    } catch (error) {
      console.error('❌ Erro ao conectar dispositivo:', error);
      throw error;
    }
  }

  /**
   * Busca leituras de um dispositivo específico
   */
  async buscarLeituras(dispositivoId: number, limite: number = 10): Promise<any> {
    try {
      console.log('📊 Buscando leituras do dispositivo:', dispositivoId);
      
      const response = await fetch(
        `http://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/dispositivos/leituras.php?dispositivo_id=${dispositivoId}&limite=${limite}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      console.log('📊 Resposta das leituras:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar leituras:', error);
      throw error;
    }
  }

  /**
   * Busca dispositivos com dados das últimas leituras (para o dashboard)
   */
  async buscarDispositivosComLeituras(userId: number): Promise<{ status: string; dados?: any[]; mensagem?: string }> {
    try {
      console.log('📱 Buscando dispositivos com leituras para usuário:', userId);
      
      const response = await fetch(
        `http://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/dispositivos/listar.php?usuario_id=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      console.log('📱 Resposta dos dispositivos:', data);
      console.log('📱 Estrutura dos dados:', {
        status: data.status,
        dados: data.dados,
        dispositivos: data.dados?.dispositivos
      });
      
      if (data.status === 'sucesso' && data.dados) {
        // Mapeia os dados para o formato esperado pelo dashboard
        const dispositivos = await Promise.all(
          (data.dados.dispositivos || []).map(async (disp: any) => {
            let leitura_atual = null;
            
            // Se o dispositivo tem leituras, busca a mais recente
            if (disp.total_leituras > 0 && disp.ultima_leitura) {
              const ultimaLeitura = disp.ultima_leitura;
              console.log('📊 Última leitura encontrada:', ultimaLeitura);
              
              // Mapeia para o formato esperado pela UI
              leitura_atual = {
                ph: {
                  valor: ultimaLeitura.ph !== null && ultimaLeitura.ph !== undefined ? Number(ultimaLeitura.ph) : null,
                  status: this.getParameterStatus(ultimaLeitura.ph, 'ph'),
                  unidade: ''
                },
                turbidez: {
                  valor: ultimaLeitura.turbidez !== null && ultimaLeitura.turbidez !== undefined ? Number(ultimaLeitura.turbidez) : null,
                  status: this.getParameterStatus(ultimaLeitura.turbidez, 'turbidez'),
                  unidade: '%'
                },
                condutividade: {
                  valor: ultimaLeitura.condutividade !== null && ultimaLeitura.condutividade !== undefined ? Number(ultimaLeitura.condutividade) : null,
                  status: this.getParameterStatus(ultimaLeitura.condutividade, 'condutividade'),
                  unidade: ''
                },
                temperatura: {
                  valor: ultimaLeitura.temperatura !== null && ultimaLeitura.temperatura !== undefined ? Number(ultimaLeitura.temperatura) : null,
                  status: this.getParameterStatus(ultimaLeitura.temperatura, 'temperatura'),
                  unidade: '°C'
                },
                timestamp: ultimaLeitura.data_hora
              };
              
              console.log('✅ Leitura mapeada:', leitura_atual);
            }
            
            const dispositivoMapeado = {
              id: disp.id,
              nome: disp.nome,
              codigo_dispositivo: disp.codigo_verificacao,
              localizacao: disp.localizacao,
              status: disp.status || 'offline',
              nivel_bateria: 94, // Valor fixo ilustrativo
              leitura_atual,
              estatisticas: {
                total_leituras: disp.total_leituras,
                ultima_leitura: disp.ultima_leitura?.data_hora
              },
              datas: {
                criacao: disp.data_criacao,
                atualizacao: disp.data_criacao
              }
            };
            
            console.log('📱 Dispositivo mapeado:', dispositivoMapeado);
            return dispositivoMapeado;
          })
        );
        
        console.log('📱 Dispositivos finais:', dispositivos);
        return {
          status: 'sucesso',
          dados: dispositivos
        };
      }
      
      console.log('❌ Erro na resposta da API:', data);
      return {
        status: 'erro',
        mensagem: data.mensagem || 'Erro ao buscar dispositivos'
      };
    } catch (error) {
      console.error('❌ Erro ao buscar dispositivos com leituras:', error);
      return {
        status: 'erro',
        mensagem: 'Erro de conexão: ' + error.message
      };
    }
  }

  /**
   * Determina o status de um parâmetro baseado no valor
   */
  private getParameterStatus(value: any, parameter: string): 'normal' | 'warning' | 'danger' | 'unknown' {
    if (value === null || value === undefined || value === '') return 'unknown';
    
    switch (parameter) {
      case 'ph':
        if (value < 6.5 || value > 8.5) return 'danger';
        if (value < 7.0 || value > 8.0) return 'warning';
        return 'normal';
      case 'turbidez':
        if (value > 10) return 'danger';
        if (value > 5) return 'warning';
        return 'normal';
      case 'condutividade':
        if (value > 2.5) return 'danger';
        if (value > 2.0) return 'warning';
        return 'normal';
      case 'temperatura':
        if (value < 15 || value > 30) return 'danger';
        if (value < 18 || value > 25) return 'warning';
        return 'normal';
      default:
        return 'normal';
    }
  }

  /**
   * Formata tempo relativo para exibição
   */
  private formatarTempoRelativo(dataHora: string): string {
    const agora = new Date();
    const data = new Date(dataHora);
    const diferenca = agora.getTime() - data.getTime();
    
    const minutos = Math.floor(diferenca / (1000 * 60));
    const horas = Math.floor(diferenca / (1000 * 60 * 60));
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    
    if (minutos < 60) {
      return `${minutos} min atrás`;
    } else if (horas < 24) {
      return `${horas}h atrás`;
    } else {
      return `${dias} dia${dias > 1 ? 's' : ''} atrás`;
    }
  }
}

export const deviceService = new DeviceService();