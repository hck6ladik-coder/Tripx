import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useTheme } from './hooks/useTheme';
import { useAppStore } from './store/useAppStore';
import { useFileSystem } from './hooks/useFileSystem';

export default function App() {
  useTheme();

  const { conversations, createConversation, setActiveConversation } =
    useAppStore();
  const { loadProject } = useFileSystem();

  // Ensure at least one conversation exists
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation();
    } else if (
      !useAppStore.getState().activeConversationId &&
      conversations.length > 0
    ) {
      setActiveConversation(conversations[0].id);
    }
  }, [conversations.length, createConversation, setActiveConversation, conversations]);

  // Load local workspace project on first mount
  useEffect(() => {
    loadProject('d:/trip');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <AppLayout />;
}
