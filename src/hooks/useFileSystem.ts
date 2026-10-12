import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { fetchProjectFiles, openProject } from '@/lib/api';

export function useFileSystem() {
  const { setCurrentProject, setFileTree, addToast } = useAppStore();

  const loadProject = useCallback(
    async (path: string) => {
      try {
        const project = await openProject(path);
        setCurrentProject(project);
        setFileTree(project.rootFiles);
        addToast({
          type: 'success',
          title: 'Projekt otevřen',
          message: project.name,
        });
        return project;
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Chyba při otevírání projektu',
          message: String(error),
        });
        throw error;
      }
    },
    [setCurrentProject, setFileTree, addToast]
  );

  const refreshFiles = useCallback(
    async (projectPath: string) => {
      const files = await fetchProjectFiles(projectPath);
      setFileTree(files);
    },
    [setFileTree]
  );

  return { loadProject, refreshFiles };
}
