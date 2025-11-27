/**
 * Serviços de autenticação
 */

import { apiService, ApiResponse, Usuario } from './api';

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface SignupData {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
}

export interface LoginResponse {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
}

class AuthService {
  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    return apiService.post<LoginResponse>('/usuarios/login.php', credentials);
  }

  /**
   * Registra um novo usuário
   */
  async signup(userData: SignupData): Promise<ApiResponse<void>> {
    return apiService.post<void>('/usuarios/cadastro.php', userData);
  }

  /**
   * Busca perfil do usuário (se implementado)
   */
  async getProfile(userId: number): Promise<ApiResponse<Usuario>> {
    return apiService.get<Usuario>('/usuarios/perfil.php', { usuario_id: userId });
  }

  /**
   * Atualiza perfil do usuário (se implementado)
   */
  async updateProfile(userId: number, userData: Partial<Usuario>): Promise<ApiResponse<void>> {
    return apiService.put<void>(`/usuarios/perfil.php?id=${userId}`, userData);
  }
}

export const authService = new AuthService();