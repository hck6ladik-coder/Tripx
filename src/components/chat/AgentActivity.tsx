import { AgentStatus } from '@/types';
import { AGENT_STATUS_LABELS } from '@/lib/constants';
import {
  Loader2,
  Brain,
  FileSearch,
  FileEdit,
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentActivityProps {
  status: AgentStatus;
}

const statusConfig: Record<
  AgentStatus,
  { icon: React.ReactNode; color: string; animate: boolean }
> = {
  idle: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-text-secondary',
    animate: false,
  },
  thinking: {
    icon: <Brain className="w-4 h-4" />,
    color: 'text-accent',
    animate: true,
  },
  planning: {
    icon: <Brain className="w-4 h-4" />,
    color: 'text-warning',
    animate: true,
  },
  reading_files: {
    icon: <FileSearch className="w-4 h-4" />,
    color: 'text-accent',
    animate: true,
  },
  editing_files: {
    icon: <FileEdit className="w-4 h-4" />,
    color: 'text-success',
    animate: true,
  },
  running_commands: {
    icon: <Terminal className="w-4 h-4" />,
    color: 'text-warning',
    animate: true,
  },
  waiting_approval: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-warning',
    animate: false,
  },
  completed: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-success',
    animate: false,
  },
  failed: {
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-error',
    animate: false,
  },
};

export function AgentActivity({ status }: AgentActivityProps) {
  const config = statusConfig[status] || statusConfig.idle;

  return (
    <div className="px-4 py-3 bg-surface/50 border-y border-border/50">
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        <div
          className={cn(
            'flex items-center justify-center',
            config.color,
            config.animate && 'animate-pulse'
          )}
        >
          {config.animate ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            config.icon
          )}
        </div>
        <span className={cn('text-sm font-medium', config.color)}>
          {AGENT_STATUS_LABELS[status] || status}
        </span>
      </div>
    </div>
  );
}
