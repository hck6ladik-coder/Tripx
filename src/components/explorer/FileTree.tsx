import { useAppStore } from '@/store/useAppStore';
import { FileNode } from '@/types';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileType,
  FileImage,
} from 'lucide-react';

const fileIcons: Record<string, React.ReactNode> = {
  ts: <FileCode className="w-4 h-4 text-accent" />,
  tsx: <FileCode className="w-4 h-4 text-accent" />,
  js: <FileCode className="w-4 h-4 text-warning" />,
  jsx: <FileCode className="w-4 h-4 text-warning" />,
  json: <FileJson className="w-4 h-4 text-success" />,
  md: <FileType className="w-4 h-4 text-text-secondary" />,
  css: <FileType className="w-4 h-4 text-accent" />,
  html: <FileType className="w-4 h-4 text-error" />,
  png: <FileImage className="w-4 h-4 text-success" />,
  jpg: <FileImage className="w-4 h-4 text-success" />,
  svg: <FileImage className="w-4 h-4 text-success" />,
};

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return fileIcons[ext] || <FileType className="w-4 h-4 text-text-secondary" />;
}

export function FileTree() {
  const { fileTree, toggleDirectory, openFile } = useAppStore();

  const renderNode = (node: FileNode, depth = 0) => {
    const isDirectory = node.type === 'directory';
    const paddingLeft = depth * 12 + 8;

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-1.5 py-1.5 pr-2 cursor-pointer hover:bg-surface/50 transition-colors group',
            node.isModified && 'text-warning'
          )}
          style={{ paddingLeft }}
          onClick={() => {
            if (isDirectory) {
              toggleDirectory(node.id);
            } else {
              openFile(node);
            }
          }}
        >
          {isDirectory ? (
            node.isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
            )
          ) : (
            <span className="w-3.5" />
          )}

          {isDirectory ? (
            node.isOpen ? (
              <FolderOpen className="w-4 h-4 text-accent" />
            ) : (
              <Folder className="w-4 h-4 text-accent" />
            )
          ) : (
            getFileIcon(node.name)
          )}

          <span
            className={cn(
              'text-sm truncate flex-1',
              node.isModified
                ? 'text-warning font-medium'
                : 'text-text-primary'
            )}
          >
            {node.name}
          </span>

          {node.gitStatus && node.gitStatus !== 'committed' && (
            <span
              className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                node.gitStatus === 'modified' && 'bg-warning',
                node.gitStatus === 'added' && 'bg-success',
                node.gitStatus === 'untracked' && 'bg-text-secondary',
                node.gitStatus === 'deleted' && 'bg-error'
              )}
            />
          )}
        </div>

        {isDirectory && node.isOpen && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto py-1">
      {fileTree.map((node) => renderNode(node))}
    </div>
  );
}
