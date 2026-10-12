import { useAppStore } from '@/store/useAppStore';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { settings, updateSettings } = useAppStore();
  const theme = settings.theme;

  const options = [
    { id: 'light' as const, icon: <Sun className="w-4 h-4" />, label: 'Světlý' },
    { id: 'dark' as const, icon: <Moon className="w-4 h-4" />, label: 'Tmavý' },
    {
      id: 'system' as const,
      icon: <Monitor className="w-4 h-4" />,
      label: 'Systém',
    },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-lg">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => updateSettings({ theme: opt.id })}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            theme === opt.id
              ? 'bg-accent/20 text-accent'
              : 'text-text-secondary hover:text-text-primary'
          )}
          title={opt.label}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
