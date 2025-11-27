import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

interface ToastState {
  visible: boolean;
  title: string;
  description?: string;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    title: '',
    description: '',
  });

  const showToast = useCallback((options: ToastOptions) => {
// Por enquanto, usarei o Alert como um substituto simples para o toast
// Em um aplicativo real, talvez podemos usar uma biblioteca toast adequada realmente
    Alert.alert(options.title, options.description || '');
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    toast: showToast,
    hideToast,
    toastState: toast,
  };
};
