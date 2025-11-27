import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme } from '../utils/colors';

type ThemeMode = 'light';

interface ThemeContextData {
  mode: ThemeMode;
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const useThemeMode = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode] = useState<ThemeMode>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        applyTheme('light');
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, isReady }}>
      {children}
    </ThemeContext.Provider>
  );

};



