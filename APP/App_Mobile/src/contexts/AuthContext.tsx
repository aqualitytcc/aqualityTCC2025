import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, LoginCredentials, SignupData } from '../services/authService';
import { handleApiError } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  sobrenome: string;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@water-sense:user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Erro ao carregar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('🔐 Tentando login com:', { email, senha: '***' });
      
      const credentials: LoginCredentials = {
        email,
        senha: password
      };
      
      const response = await authService.login(credentials);
      
      console.log('📡 Resposta do login:', response);
      
      if (response.status === 'sucesso' && response.dados) {
        const userData: User = {
          id: response.dados.id,
          email: response.dados.email,
          name: response.dados.nome,
          sobrenome: response.dados.sobrenome
        };
        
        console.log('✅ Login bem-sucedido:', userData);
        setUser(userData);
        await AsyncStorage.setItem('@water-sense:user', JSON.stringify(userData));
        return true;
      } else {
        console.error('❌ Login falhou:', response.mensagem);
        return false;
      }
    } catch (error) {
      console.error('💥 Erro no login:', handleApiError(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('📝 Tentando cadastro com:', { ...userData, senha: '***' });
      
      const response = await authService.signup(userData);
      
      console.log('📡 Resposta do cadastro:', response);
      
      if (response.status === 'sucesso') {
        console.log('✅ Cadastro bem-sucedido, fazendo login automático...');
        // Após cadastro bem-sucedido, faz login automaticamente
        return await login(userData.email, userData.senha);
      } else {
        console.error('❌ Cadastro falhou:', response.mensagem);
        return false;
      }
    } catch (error) {
      console.error('💥 Erro no cadastro:', handleApiError(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('@water-sense:user');
    } catch (error) {
      console.log('Erro no logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

