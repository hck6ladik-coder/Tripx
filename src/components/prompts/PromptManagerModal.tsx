import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { SavedPrompt, PromptCategory } from '@/types';
import { generateId, cn } from '@/lib/utils';
import {
  X,
  Plus,
  Search,
  Star,
  StarOff,
  Trash2,
  Copy,
  Edit3,
  Check,
  BookOpen,
  Zap,
  Bug,
  RefreshCw,
  TestTube,
  Shield,
  FileText,
  Sparkles,
  Tag,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button } from '../ui/Button';

const CATEGORY_ICONS: Record<PromptCategory, React.ReactNode> = {
  debug: <Bug className="w-3.5 h-3.5" />,
  refactor: <RefreshCw className="w-3.5 h-3.5" />,
  test: <TestTube className="w-3.5 h-3.5" />,
  review: <Shield className="w-3.5 h-3.5" />,
  docs: <FileText className="w-3.5 h-3.5" />,
  explain: <BookOpen className="w-3.5 h-3.5" />,
  generate: <Sparkles className="w-3.5 h-3.5" />,
  custom: <Tag className="w-3.5 h-3.5" />,
};

const CATEGORY_LABELS: Record<PromptCategory, string> = {
  debug: 'Debug',
  refactor: 'Refactor',
  test: 'Testy',
  review: 'Code Review',
  docs: 'Dokumentace',
  explain: 'Vysvětlit',
  generate: 'Generovat',
  custom: 'Vlastní',
};

const CATEGORY_COLORS: Record<PromptCategory, string> = {
  debug: 'text-red-400 bg-red-500/10 border-red-500/20',
  refactor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  test: 'text-green-400 bg-green-500/10 border-green-500/20',
  review: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  docs: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  explain: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  generate: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  custom: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

const DEFAULT_PROMPTS: SavedPrompt[] = [
  {
    id: 'dp-1',
    title: 'Vysvětli kód',
    content: 'Vysvětli mi tento kód řádek po řádku, jednoduše a jasně:\n\n```{{jazyk}}\n{{výběr}}\n```',
    category: 'explain',
    tags: ['vysvětlení', 'kód'],
    favorite: false,
    isBuiltin: true,
    usageCount: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'dp-2',
    title: 'Najdi bugy',
    content: 'Projdi tento kód a najdi všechny potenciální bugy, edge cases a bezpečnostní problémy:\n\n```{{jazyk}}\n{{výběr}}\n```\n\nPro každý problém uveď: problém, závažnost (kritická/střední/nízká) a opravný návrh.',
    category: 'debug',
    tags: ['bugy', 'security', 'analýza'],
    favorite: false,
    isBuiltin: true,
    usageCount: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'dp-3',
    title: 'Refactor pro čistý kód',
    content: 'Refaktoruj tento kód podle best practices — čistý kód, SOLID principy, lepší naming, menší funkce:\n\n```{{jazyk}}\n{{výběr}}\n```\n\nVysvětli každou změnu.',
    category: 'refactor',
    tags: ['clean code', 'SOLID', 'refactor'],
    favorite: false,
    isBuiltin: true,
    usageCount: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'dp-4',
    title: 'Napiš unit testy',
    content: 'Napiš kompletní unit testy pro následující kód. Pokryj edge cases, happy path i error scénáře:\n\n```{{jazyk}}\n{{výběr}}\n```\n\nPoužij vhodný testing framework pro {{jazyk}}.',
    category: 'test',
    tags: ['unit testy', 'testing'],
    favorite: false,
    isBuiltin: true,
    usageCount: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'dp-5',
    title: 'Code Review',
    content: 'Proveď důkladný code review tohoto kódu jako senior developer:\n\n```{{jazyk}}\n{{výběr}}\n```\n\nZaměř se na: čitelnost, výkon, bezpečnost, maintainability a best practices. Buď konkrétní.',
    category: 'review',
    tags: ['review', 'senior', 'best practices'],
    favorite: true,
    isBuiltin: true,
    usageCount: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'dp-6',
    title: 'Přidej JSDoc dokumentaci',
    content: 'Přidej detailní JSDoc/TSDoc komentáře ke každé funkci, třídě a exportu v tomto souboru:\n\n```{{jazyk}}\n{{výběr}}\n```',
    category: 'docs',
    tags: ['JSDoc', 'dokumentace', 'komentáře'],
    favorite: false,
    isBuiltin: true,
    usageCount: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'dp-7',
    title: 'Optimalizuj výkon',
    content: 'Analyzuj a optimalizuj výkon tohoto kódu. Najdi bottlenecky, zbytečné re-rendery, memory leaks:\n\n```{{jazyk}}\n{{výběr}}\n```\n\nUveď konkrétní metriky a měřitelná zlepšení.',
    category: 'refactor',
    tags: ['výkon', 'optimalizace', 'performance'],
    favorite: false,
    isBuiltin: true,
    usageCount: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'dp-8',
    title: 'Vygeneruj TypeScript typy',
    content: 'Na základě tohoto kódu nebo dat vygeneruj přesné TypeScript typy, interfaces a enums:\n\n{{výběr}}\n\nPřidej JSDoc komentáře k typům.',
    category: 'generate',
    tags: ['TypeScript', 'typy', 'interfaces'],
    favorite: false,
    isBuiltin: true,
    usageCount: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'dp-9',
    title: 'Konverze do souboru {{soubor}}',
    content: 'Refaktoruj a migruj kód ze souboru {{soubor}} do modernější struktury. Zachovej logiku, ale vylepši architekturu.',
    category: 'refactor',
    tags: ['migrace', 'architektura'],
    favorite: false,
    isBuiltin: true,
    usageCount: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'dp-10',
    title: 'Bezpečnostní audit',
    content: 'Proveď kompletní bezpečnostní audit tohoto kódu. Hledej: SQL injection, XSS, CSRF, insecure deserialization, exposed secrets, improper auth:\n\n```{{jazyk}}\n{{výběr}}\n```\n\nSeřaď problémy podle závažnosti (CVSS skóre).',
    category: 'review',
    tags: ['security', 'audit', 'CVE'],
    favorite: false,
    isBuiltin: true,
    usageCount: 0,
    createdAt: new Date('2024-01-01'),
  },
];

const VARIABLES = ['{{výběr}}', '{{soubor}}', '{{jazyk}}', '{{projekt}}', '{{chyba}}'];

interface PromptManagerModalProps {
  onInsert: (text: string) => void;
}

type View = 'list' | 'create' | 'edit';

export function PromptManagerModal({ onInsert }: PromptManagerModalProps) {
  const { promptManagerOpen, setPromptManagerOpen, savedPrompts, addSavedPrompt, updateSavedPrompt, deleteSavedPrompt, togglePromptFavorite } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all' | 'favorites'>('all');
  const [view, setView] = useState<View>('list');
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<SavedPrompt | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<PromptCategory>('custom');
  const [formTags, setFormTags] = useState('');

  const allPrompts = useMemo(() => {
    const builtinIds = new Set(DEFAULT_PROMPTS.map((p) => p.id));
    const userPrompts = savedPrompts.filter((p) => !builtinIds.has(p.id));
    return [...DEFAULT_PROMPTS, ...userPrompts];
  }, [savedPrompts]);

  const filtered = useMemo(() => {
    return allPrompts.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.content.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'favorites' ? p.favorite : p.category === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [allPrompts, search, selectedCategory]);

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormCategory('custom');
    setFormTags('');
    setEditingPrompt(null);
  };

  const openCreate = () => {
    resetForm();
    setView('create');
    setSelectedPrompt(null);
  };

  const openEdit = (prompt: SavedPrompt) => {
    if (prompt.isBuiltin) return;
    setFormTitle(prompt.title);
    setFormContent(prompt.content);
    setFormCategory(prompt.category);
    setFormTags(prompt.tags.join(', '));
    setEditingPrompt(prompt);
    setView('edit');
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    const tags = formTags.split(',').map((t) => t.trim()).filter(Boolean);

    if (view === 'edit' && editingPrompt) {
      updateSavedPrompt(editingPrompt.id, {
        title: formTitle,
        content: formContent,
        category: formCategory,
        tags,
      });
    } else {
      addSavedPrompt({
        id: generateId(),
        title: formTitle,
        content: formContent,
        category: formCategory,
        tags,
        favorite: false,
        isBuiltin: false,
        usageCount: 0,
        createdAt: new Date(),
      });
    }
    resetForm();
    setView('list');
  };

  const handleCopy = (prompt: SavedPrompt) => {
    navigator.clipboard.writeText(prompt.content);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleInsert = (prompt: SavedPrompt) => {
    updateSavedPrompt(prompt.id, { usageCount: (prompt.usageCount || 0) + 1 });
    onInsert(prompt.content);
    setPromptManagerOpen(false);
  };

  const insertVariable = (variable: string) => {
    setFormContent((prev) => prev + variable);
  };

  if (!promptManagerOpen) return null;

  const categories: Array<{ id: PromptCategory | 'all' | 'favorites'; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: 'Vše', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'favorites', label: 'Oblíbené', icon: <Star className="w-3.5 h-3.5" /> },
    ...Object.entries(CATEGORY_LABELS).map(([id, label]) => ({
      id: id as PromptCategory,
      label,
      icon: CATEGORY_ICONS[id as PromptCategory],
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setPromptManagerOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl h-[80vh] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface-elevated/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent/10">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Prompt Manager</h2>
              <p className="text-xs text-text-secondary">{allPrompts.length} promptů · Klikni pro vložení do chatu</p>
            </div>
          </div>
          <div className="flex-1" />
          {view === 'list' && (
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Nový prompt
            </Button>
          )}
          <button
            onClick={() => setPromptManagerOpen(false)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {view === 'list' ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Categories */}
            <div className="w-48 border-r border-border bg-surface-elevated/30 flex flex-col py-2 flex-shrink-0">
              {/* Search */}
              <div className="px-3 pb-2">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-surface border border-border rounded-lg">
                  <Search className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Hledat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-secondary/50 outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {categories.map((cat) => {
                  const count =
                    cat.id === 'all'
                      ? allPrompts.length
                      : cat.id === 'favorites'
                        ? allPrompts.filter((p) => p.favorite).length
                        : allPrompts.filter((p) => p.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left',
                        selectedCategory === cat.id
                          ? 'bg-accent/15 text-accent font-medium'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                      )}
                    >
                      <span>{cat.icon}</span>
                      <span className="flex-1">{cat.label}</span>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full',
                        selectedCategory === cat.id ? 'bg-accent/20 text-accent' : 'bg-surface text-text-secondary'
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main area */}
            <div className="flex flex-1 overflow-hidden">
              {/* Prompt list */}
              <div className="w-72 border-r border-border overflow-y-auto flex-shrink-0">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-text-secondary">
                    <BookOpen className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">Žádné prompty</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filtered.map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => setSelectedPrompt(prompt)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-xl border transition-all group',
                          selectedPrompt?.id === prompt.id
                            ? 'bg-accent/10 border-accent/30'
                            : 'bg-surface-elevated/50 border-transparent hover:border-border hover:bg-surface-elevated'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={cn(
                                'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium',
                                CATEGORY_COLORS[prompt.category]
                              )}>
                                {CATEGORY_ICONS[prompt.category]}
                                {CATEGORY_LABELS[prompt.category]}
                              </span>
                              {prompt.isBuiltin && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-surface border border-border text-text-secondary">
                                  built-in
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-text-primary truncate">{prompt.title}</p>
                            <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1 leading-relaxed">
                              {prompt.content.replace(/\n/g, ' ')}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePromptFavorite(prompt.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                          >
                            {prompt.favorite ? (
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            ) : (
                              <StarOff className="w-3.5 h-3.5 text-text-secondary hover:text-yellow-400" />
                            )}
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail / Preview */}
              <div className="flex-1 overflow-y-auto">
                {selectedPrompt ? (
                  <div className="p-5 h-full flex flex-col">
                    {/* Title & Category */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={cn(
                            'inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border font-medium',
                            CATEGORY_COLORS[selectedPrompt.category]
                          )}>
                            {CATEGORY_ICONS[selectedPrompt.category]}
                            {CATEGORY_LABELS[selectedPrompt.category]}
                          </span>
                          {selectedPrompt.usageCount! > 0 && (
                            <span className="text-[10px] text-text-secondary">
                              Použito {selectedPrompt.usageCount}×
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-text-primary">{selectedPrompt.title}</h3>
                      </div>
                      <button
                        onClick={() => togglePromptFavorite(selectedPrompt.id)}
                        className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
                        title={selectedPrompt.favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
                      >
                        {selectedPrompt.favorite ? (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ) : (
                          <StarOff className="w-4 h-4 text-text-secondary" />
                        )}
                      </button>
                    </div>

                    {/* Content Preview */}
                    <div className="flex-1 relative mb-4">
                      <div className="w-full h-full min-h-[200px] p-4 bg-surface-elevated/50 border border-border rounded-xl text-sm text-text-primary font-mono leading-relaxed whitespace-pre-wrap overflow-auto">
                        {selectedPrompt.content.split(/({{[^}]+}})/g).map((part, i) =>
                          part.match(/^{{.+}}$/) ? (
                            <span key={i} className="bg-accent/20 text-accent border border-accent/30 rounded px-1 py-0.5 text-xs font-sans font-medium">
                              {part}
                            </span>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Variables hint */}
                    {VARIABLES.some(v => selectedPrompt.content.includes(v)) && (
                      <div className="flex items-start gap-2 p-3 bg-accent/5 border border-accent/15 rounded-lg mb-4">
                        <Info className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-text-secondary">
                          <span className="text-accent font-medium">Proměnné: </span>
                          Prompt obsahuje proměnné — po vložení do chatu je nahraď konkrétními hodnotami.
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {selectedPrompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {selectedPrompt.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 text-[11px] bg-surface-elevated border border-border rounded-full text-text-secondary">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-border">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleInsert(selectedPrompt)}
                        className="flex-1"
                      >
                        <ChevronRight className="w-3.5 h-3.5 mr-1.5" />
                        Vložit do chatu
                      </Button>
                      <button
                        onClick={() => handleCopy(selectedPrompt)}
                        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-border transition-colors"
                        title="Kopírovat do schránky"
                      >
                        {copiedId === selectedPrompt.id ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      {!selectedPrompt.isBuiltin && (
                        <>
                          <button
                            onClick={() => openEdit(selectedPrompt)}
                            className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 border border-border transition-colors"
                            title="Upravit prompt"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              deleteSavedPrompt(selectedPrompt.id);
                              setSelectedPrompt(null);
                            }}
                            className="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-error/10 border border-border transition-colors"
                            title="Smazat prompt"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-text-secondary gap-3">
                    <div className="p-4 rounded-2xl bg-surface-elevated/50">
                      <Zap className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm">Vyber prompt ze seznamu</p>
                    <p className="text-xs text-text-secondary/60">nebo vytvoř vlastní kliknutím na "+ Nový prompt"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Create / Edit view */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => { resetForm(); setView('list'); }}
                  className="text-text-secondary hover:text-text-primary text-sm transition-colors"
                >
                  ← Zpět
                </button>
                <span className="text-text-secondary">/</span>
                <h3 className="text-sm font-semibold text-text-primary">
                  {view === 'edit' ? 'Upravit prompt' : 'Nový prompt'}
                </h3>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Název *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="např. Refaktoruj na async/await"
                  className="w-full px-3 py-2.5 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Kategorie</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_LABELS) as PromptCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFormCategory(cat)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all',
                        formCategory === cat
                          ? CATEGORY_COLORS[cat] + ' font-medium'
                          : 'border-border text-text-secondary hover:border-border-strong'
                      )}
                    >
                      {CATEGORY_ICONS[cat]}
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-text-secondary">Obsah promptu *</label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-text-secondary mr-1">Vložit proměnnou:</span>
                    {VARIABLES.map((v) => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        className="px-1.5 py-0.5 text-[10px] bg-accent/10 text-accent border border-accent/20 rounded hover:bg-accent/20 transition-colors font-mono"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Napiš svůj prompt... Použij {{výběr}} pro aktuální kód, {{jazyk}} pro jazyk, {{soubor}} pro název souboru."
                  rows={10}
                  className="w-full px-3 py-2.5 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/40 font-mono outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Tagy (oddělené čárkou)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="např. refactor, TypeScript, async"
                  className="w-full px-3 py-2.5 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={!formTitle.trim() || !formContent.trim()}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  {view === 'edit' ? 'Uložit změny' : 'Vytvořit prompt'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { resetForm(); setView('list'); }}
                >
                  Zrušit
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
