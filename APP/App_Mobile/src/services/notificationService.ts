/**
 * Serviço para gerenciar notificações push - Versão Expo Go
 */

import React from 'react';
import { Alert } from 'react-native';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  /**
   * Inicializa o serviço de notificações (versão simplificada)
   */
  async initialize(): Promise<boolean> {
    console.log('🔔 Serviço de notificações inicializado (versão Expo Go)');
    return true;
  }

  /**
   * Envia notificação de alerta (usando Alert nativo)
   */
  async sendAlertNotification(alert: {
    titulo: string;
    mensagem: string;
    nivel: 'info' | 'warning' | 'critical';
    dispositivo: string;
  }): Promise<void> {
    const emoji = this.getAlertEmoji(alert.nivel);
    const title = `${emoji} ${alert.titulo}`;
    
    // No Expo Go, usar Alert nativo
    Alert.alert(title, alert.mensagem, [
      { text: 'OK', style: 'default' }
    ]);
    
    console.log('🔔 Alerta enviado:', { title, message: alert.mensagem });
  }

  /**
   * Obtém emoji baseado no nível do alerta
   */
  private getAlertEmoji(nivel: string): string {
    switch (nivel) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  }

  /**
   * Limpa o badge (simulado)
   */
  async clearBadge(): Promise<void> {
    console.log('🔔 Badge limpo');
  }

  /**
   * Obtém badge count (simulado)
   */
  async getBadgeCount(): Promise<number> {
    return 0;
  }

  /**
   * Remove listeners (vazio na versão simplificada)
   */
  cleanup() {
    console.log('🔔 Cleanup realizado');
  }
}

// Instância global do serviço
export const notificationService = new NotificationService();

/**
 * Hook para usar notificações (versão simplificada)
 */
export const useNotifications = () => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [badgeCount, setBadgeCount] = React.useState(0);

  React.useEffect(() => {
    const init = async () => {
      const success = await notificationService.initialize();
      setIsInitialized(success);
    };

    init();

    return () => {
      notificationService.cleanup();
    };
  }, []);

  const sendAlert = async (alert: {
    titulo: string;
    mensagem: string;
    nivel: 'info' | 'warning' | 'critical';
    dispositivo: string;
  }) => {
    await notificationService.sendAlertNotification(alert);
  };

  const clearBadge = async () => {
    await notificationService.clearBadge();
    setBadgeCount(0);
  };

  return {
    isInitialized,
    badgeCount,
    sendAlert,
    clearBadge,
  };
};