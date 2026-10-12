import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useTheme() {
  const { settings } = useAppStore();
  const theme = settings.theme;

  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && systemDark);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const systemDark =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true;

  return {
    isDark: theme === 'dark' || (theme === 'system' && systemDark),
    theme,
  };
}
