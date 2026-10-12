import { useState } from 'react';
import { Button } from '../ui/Button';
import { RefreshCw, ExternalLink, Globe, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PreviewPanel() {
  const [url, setUrl] = useState('http://localhost:3000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  const handleRefresh = () => {
    setLoading(true);
    setKey((k) => k + 1);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 h-9 border-b border-border bg-background-secondary">
        <Globe className="w-4 h-4 text-text-secondary" />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 h-7 px-2 bg-surface border border-border rounded text-xs text-text-primary focus:outline-none focus:border-accent/50"
        />
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
          <RefreshCw
            className={cn('w-4 h-4', loading && 'animate-spin')}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.open(url, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Preview */}
      <div className="flex-1 relative">
        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <AlertCircle className="w-8 h-8 text-error mb-3" />
            <p className="text-sm text-error">{error}</p>
          </div>
        ) : (
          <iframe
            key={key}
            src={url}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms"
            onError={() => setError('Nepodařilo se načíst náhled')}
          />
        )}
      </div>
    </div>
  );
}
