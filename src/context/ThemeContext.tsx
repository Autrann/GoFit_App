import React, { createContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  // null = sigue al sistema, true = forzado oscuro, false = forzado claro
  const [manualTheme, setManualTheme] = useState<boolean | null>(null);

  // Si hay un tema manual, usamos ese; si no, usamos el del sistema
  const isDark = manualTheme !== null ? manualTheme : systemScheme === 'dark';

  const toggleTheme = () => {
    setManualTheme(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};