import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  email: string;
  name: string;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
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

  // Credenciais padrão
  const DEFAULT_EMAIL = 'aquality@tcc.com';
  const DEFAULT_PASSWORD = 'aqua@123';

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
      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar credenciais
      if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
        const userData: User = {
          email: email,
          name: 'Rodinei Almirante Silva'
        };
        
        setUser(userData);
        await AsyncStorage.setItem('@water-sense:user', JSON.stringify(userData));
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log('Erro no login:', error);
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
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

