import React, { createContext, useState, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from '../theme/colors';
import { createKineticStyles } from '../theme/kineticStyles';

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
  kStyles: ReturnType<typeof createKineticStyles>;
};

export const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
  colors: darkColors,
  kStyles: createKineticStyles(darkColors, true),
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  // Por defecto iniciamos en true 
  const [manualTheme, setManualTheme] = useState<boolean | null>(true);

  const isDark = manualTheme !== null ? manualTheme : systemScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const kStyles = useMemo(() => createKineticStyles(colors, isDark), [isDark]);

  const toggleTheme = () => setManualTheme((prev) => !(prev !== null ? prev : systemScheme === 'dark'));

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors, kStyles }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);