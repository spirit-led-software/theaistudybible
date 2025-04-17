import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { createContext, use, useContext, useEffect, useState } from 'react';
import { z } from 'zod';
import { createCookie, readCookie } from '../utils/cookies';

export type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  resolvedTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const getThemeCookie = createServerFn({ method: 'GET' })
  .validator(z.string())
  .handler(({ data: storageKey }) => getCookie(storageKey) as Theme);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'asb-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document === 'undefined'
      ? (use(getThemeCookie({ data: storageKey })) ?? defaultTheme)
      : ((readCookie(storageKey) as Theme) ?? defaultTheme),
  );
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    theme === 'system' ? 'light' : theme,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      setResolvedTheme(systemTheme);
      createCookie(storageKey, systemTheme, 365);
      return;
    }

    root.classList.add(theme);
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
