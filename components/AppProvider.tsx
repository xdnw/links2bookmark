import React, { createContext, useContext, useState, useCallback } from 'react';
import { ExportFormat } from '@/components/ExportDropdown';
import { FolderSelectHandler } from '@/hooks/useBookmarkOperations';
import { Tabs } from 'wxt/browser';

interface AppContextType {
  // Tab state
  selectedTabs: Tabs.Tab[];
  
  // URL input state
  urlList: string;
  setUrlList: (list: string) => void;
  parsedUrls: { title: string, url: string }[];
  parseUrls: () => boolean;
  clearParsedUrls: () => void;
  
  // general operations
  bookmarkOperations: ReturnType<typeof useBookmarkOperations>;
  
  // Folder handler
  folderSelectHandler: ((folderIds: string[]) => void) | undefined;
  setFolderSelectHandler: React.Dispatch<React.SetStateAction<((folderIds: string[]) => void) | undefined>>;

  // Messages
  bookmarkSuccess: string | undefined;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Tab state
  const [selectedTabs, setSelectedTabs] = useState<Tabs.Tab[]>([]);
  
  // URL input state
  const [urlList, setUrlList] = useState<string>('');
  const [parsedUrls, setParsedUrls] = useState<{ title: string, url: string }[]>([]);
  
  // Initialize the folder handler system
  const bookmarkOperations = useBookmarkOperations();
  const [folderSelectHandler, setFolderSelectHandler] = useState<((folderIds: string[]) => void) | undefined>(undefined);
  // Parse URLs from text input
  const parseUrls = useCallback(() => {
    try {
      const lines = urlList.split('\n').filter(line => line.trim() !== '');
      const parsedItems = lines.map(line => {
        let [title, url] = line.split(/\s+(.+)/);
        if (!url) {
          url = title;
          title = new URL(url).hostname;
        }
        return { title, url };
      });
      
      if (parsedItems.length > 0) {
        setParsedUrls(parsedItems);
        console.log('set parsed URLs:', parsedItems);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error parsing URLs:", e);
      return false;
    }
  }, [urlList]);
  
  const clearParsedUrls = useCallback(() => {
    setParsedUrls([]);
    setUrlList('');
  }, []);
  
  // Load selected tabs
  React.useEffect(() => {
    const loadSelectedTabs = async () => {
      const tabs = await browser.tabs.query({ highlighted: true, currentWindow: true });
      setSelectedTabs(tabs);
    };
    loadSelectedTabs();
  }, []);
  
  return (
    <AppContext.Provider value={{
      selectedTabs,
      urlList,
      setUrlList,
      parsedUrls,
      parseUrls,
      clearParsedUrls,
      bookmarkOperations,
      folderSelectHandler,
      setFolderSelectHandler,
      bookmarkSuccess: bookmarkOperations.bookmarkSuccess,
      showSuccess: bookmarkOperations.showSuccess,
      showError: bookmarkOperations.showError,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};