import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { fetchModels, fetchProviders } from '@/lib/api';
import { AIModel, AIProvider } from '@/types';
import { ChevronDown, Star, Check, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ModelSelector() {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const { selectedModel, setSelectedModel } = useAppStore();

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([fetchModels(), fetchProviders()]).then(([m, p]) => {
        setModels(m);
        setProviders(p);
        setLoading(false);
      });
    }
  }, [open]);

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      providers
        .find((p) => p.id === m.providerId)
        ?.name.toLowerCase()
        .includes(search.toLowerCase())
  );

  const groupedModels = filteredModels.reduce(
    (acc, model) => {
      const provider = providers.find((p) => p.id === model.providerId);
      const key = provider?.name || 'Neznámý';
      if (!acc[key]) acc[key] = [];
      acc[key].push(model);
      return acc;
    },
    {} as Record<string, AIModel[]>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs bg-surface-elevated border border-border rounded-lg hover:border-accent/50 transition-colors"
      >
        <Zap className="w-3.5 h-3.5 text-accent" />
        <span className="text-text-primary">
          {selectedModel?.name || 'Vyberte model'}
        </span>
        <ChevronDown className="w-3 h-3 text-text-secondary" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-80 bg-surface-elevated border border-border rounded-xl shadow-2xl z-40 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-border">
              <input
                autoFocus
                type="text"
                placeholder="Hledat modely..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50"
              />
            </div>

            {/* Models list */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                </div>
              ) : (
                Object.entries(groupedModels).map(
                  ([providerName, providerModels]) => (
                    <div key={providerName}>
                      <div className="px-3 py-2 text-xs font-medium text-text-secondary uppercase tracking-wider bg-surface/50">
                        {providerName}
                      </div>
                      {providerModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model);
                            setOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface transition-colors text-left',
                            selectedModel?.id === model.id && 'bg-accent/10'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-text-primary truncate">
                                {model.name}
                              </span>
                              {model.favorite && (
                                <Star className="w-3 h-3 text-warning fill-warning" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-text-secondary">
                                {model.contextWindow
                                  ? `${(model.contextWindow / 1000).toFixed(0)}k kontext`
                                  : 'Neznámý kontext'}
                              </span>
                              <span className="text-xs text-text-secondary">
                                {model.capabilities.includes('vision') && '🖼️'}
                                {model.capabilities.includes('tools') && '🛠️'}
                                {model.capabilities.includes('coding') && '💻'}
                              </span>
                            </div>
                          </div>
                          {selectedModel?.id === model.id && (
                            <Check className="w-4 h-4 text-accent flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
