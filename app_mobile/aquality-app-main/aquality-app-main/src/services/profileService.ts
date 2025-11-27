import { apiService, ApiResponse } from './api';

export interface UserProfile {
  id: number;
  nome: string;
  sobrenome: string;
  nome_completo: string;
  email: string;
  telefone: string;
  foto_perfil?: string;
  data_criacao: string;
  membro_desde: string;
}

export interface UserStatistics {
  total_dispositivos: number;
  total_analises: number;
  total_alertas: number;
}

export interface ProfileData {
  usuario: UserProfile;
  estatisticas: UserStatistics;
  localizacao: string;
  atualizado_em: string;
}

export interface ProfileResponse extends ApiResponse {
  dados?: ProfileData;
}

export interface UpdateProfileData {
  nome?: string;
  sobrenome?: string;
  email?: string;
  nova_senha?: string;
  senha_atual?: string;
  foto_perfil?: string;
}

export interface UpdateProfileResponse extends ApiResponse {
  dados?: {
    id: number;
    nome: string;
    sobrenome: string;
    nome_completo: string;
    email: string;
    foto_perfil?: string;
    data_criacao: string;
  };
}

export interface PhotoUploadResponse extends ApiResponse {
  dados?: {
    foto_perfil: string;
    url_completa: string;
    nome_arquivo: string;
  };
}

class ProfileService {
  /**
   * Busca dados completos do perfil do usuário incluindo estatísticas
   */
  async getUserProfile(userId: number): Promise<ProfileResponse> {
    try {
      console.log('🔍 Buscando perfil do usuário:', userId);
      
      const response = await apiService.get(`/usuarios/estatisticas.php?usuario_id=${userId}`);
      
      console.log('📊 Resposta do perfil:', response);
      
      return response as ProfileResponse;
    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      throw error;
    }
  }

  /**
   * Formata data para exibição amigável
   */
  formatMemberSince(dataCreacao: string): string {
    const dataCriacao = new Date(dataCreacao);
    const agora = new Date();
    const diferenca = agora.getTime() - dataCriacao.getTime();
    
    const anos = Math.floor(diferenca / (1000 * 60 * 60 * 24 * 365));
    const meses = Math.floor(diferenca / (1000 * 60 * 60 * 24 * 30));
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    
    if (anos > 0) {
      return `${anos} ano${anos > 1 ? 's' : ''}`;
    } else if (meses > 0) {
      return `${meses} mês${meses > 1 ? 'es' : ''}`;
    } else if (dias > 0) {
      return `${dias} dia${dias > 1 ? 's' : ''}`;
    } else {
      return 'Hoje';
    }
  }

  /**
   * Formata estatísticas para exibição
   */
  formatStatistics(stats: UserStatistics): {
    dispositivos: string;
    analises: string;
    alertas: string;
  } {
    return {
      dispositivos: this.formatNumber(stats.total_dispositivos),
      analises: this.formatNumber(stats.total_analises),
      alertas: this.formatNumber(stats.total_alertas)
    };
  }

  /**
   * Formata números para exibição amigável
   */
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    return num.toString();
  }

  /**
   * Valida URL de foto de perfil
   */
  getAvatarUrl(fotoPerfil?: string): string | null {
    if (!fotoPerfil) return null;
    
    // Se já é uma URL completa
    if (fotoPerfil.startsWith('http')) {
      return fotoPerfil;
    }
    
    // Se é um caminho relativo, constrói URL completa
    if (fotoPerfil.startsWith('/')) {
      return `http://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile${fotoPerfil}`;
    }
    
    return null;
  }

  /**
   * Atualiza dados do perfil do usuário
   */
  async updateUserProfile(userId: number, updateData: UpdateProfileData): Promise<UpdateProfileResponse> {
    try {
      console.log('📝 Atualizando perfil do usuário:', userId, updateData);
      
      const response = await apiService.post('/usuarios/atualizar_perfil.php', {
        usuario_id: userId,
        ...updateData
      });
      
      console.log('✅ Resposta da atualização:', response);
      
      return response as UpdateProfileResponse;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Faz upload de foto de perfil
   */
  async uploadProfilePhoto(userId: number, photoUri: string): Promise<PhotoUploadResponse> {
    try {
      console.log('📸 Fazendo upload da foto de perfil:', userId);
      
      const formData = new FormData();
      formData.append('usuario_id', userId.toString());
      formData.append('foto', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);
      
      const response = await fetch(
        'http://tcc3eetecgrupo5t1.hospedagemdesites.ws/app/api_mobile/usuarios/upload_foto.php',
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      const data = await response.json();
      
      console.log('📸 Resposta do upload:', data);
      
      return data as PhotoUploadResponse;
    } catch (error) {
      console.error('❌ Erro no upload da foto:', error);
      throw error;
    }
  }

  /**
   * Gera iniciais do nome para avatar fallback
   */
  getInitials(nomeCompleto: string): string {
    return nomeCompleto
      .split(' ')
      .filter(part => part.length > 0)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  /**
   * Valida senha
   */
  validatePassword(password: string): { isValid: boolean; message: string } {
    if (!password) {
      return { isValid: false, message: 'Senha é obrigatória' };
    }
    
    if (password.length < 6) {
      return { isValid: false, message: 'Senha deve ter pelo menos 6 caracteres' };
    }
    
    return { isValid: true, message: '' };
  }

  /**
   * Valida email
   */
  validateEmail(email: string): { isValid: boolean; message: string } {
    if (!email) {
      return { isValid: false, message: 'Email é obrigatório' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Email inválido' };
    }
    
    return { isValid: true, message: '' };
  }

  /**
   * Valida nome
   */
  validateName(name: string): { isValid: boolean; message: string } {
    if (!name || name.trim().length < 2) {
      return { isValid: false, message: 'Nome deve ter pelo menos 2 caracteres' };
    }
    
    return { isValid: true, message: '' };
  }
}

export const profileService = new ProfileService();