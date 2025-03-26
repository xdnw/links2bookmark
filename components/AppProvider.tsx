interface AppContextType {
    selectedTabs: chrome.tabs.Tab[];
    urlList: string;
    setUrlList: (value: string) => void;
    parsedUrls: ParsedUrlType[];
    parseUrls: () => boolean;
    clearParsedUrls: () => void;
    bookmarkSuccess: string | null;
    setBookmarkSuccess: (message: string | null) => void;
    exportFormat: ExportFormat | null;
    setExportFormat: (format: ExportFormat) => void;
    clearExportFormat: () => void;
    handleFolderSelect: (
      folderIds: string[],
      exportFormat: ExportFormat | null,
      importedBookmarks: chrome.bookmarks.BookmarkTreeNode[] | null,
      parsedUrls: { title: string, url: string }[],
      selectedTabs: chrome.tabs.Tab[],
      onSuccess?: () => void
    ) => Promise<boolean>;
    importedBookmarks: chrome.bookmarks.BookmarkTreeNode[] | null;
    setImportedBookmarks: (bookmarks: chrome.bookmarks.BookmarkTreeNode[]) => void;
    clearImportedBookmarks: () => void;
  }

// Create a context to share state between routes
const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

function AppProvider({ children }: AppProviderProps) {
  // Keep all state at the top level to share between routes
  const { selectedTabs } = useSelectedTabs();
  const {
    urlList,
    setUrlList,
    parsedUrls,
    parseUrls,
    clearParsedUrls
  } = useUrlParser();
  const {
    bookmarkSuccess,
    setBookmarkSuccess,
    exportFormat,
    setExportFormat,
    clearExportFormat,
    // handleFolderSelect,
    importedBookmarks,
    setImportedBookmarks,
  } = useBookmarkOperations();

  const clearImportedBookmarks = useCallback(() => {
    setImportedBookmarks(null);
  }, []);

  // Provide all state and functions to child components
  const contextValue: AppContextType = {
    selectedTabs,
    urlList,
    setUrlList,
    parsedUrls,
    parseUrls,
    clearParsedUrls,
    bookmarkSuccess,
    setBookmarkSuccess,
    exportFormat,
    setExportFormat,
    clearExportFormat,
    handleFolderSelect,
    importedBookmarks,
    setImportedBookmarks,
    clearImportedBookmarks
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the app context
function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}