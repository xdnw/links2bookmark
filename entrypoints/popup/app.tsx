import React, { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './app.css';
import BookmarkTree from '../../components/BookmarkTree';
import StatusMessage from '../../components/StatusMessage';
import SelectedTabs from '../../components/SelectedTabs';
import UrlInput from '../../components/UrlInput';
import ExportDropdown, { ExportFormat } from '../../components/ExportDropdown';
import BookmarkListAction from '../../components/BookmarkListAction';
import { useSelectedTabs } from '../../hooks/useSelectedTabs';
import { useUrlParser } from '../../hooks/useUrlParser';
import { useBookmarkOperations } from '../../hooks/useBookmarkOperations';
import BookmarkSelAction from '@/components/BookmarkSelAction';
import Footer from '@/components/Footer';
// Define types for our context

interface ParsedUrlType {
  title: string;
  url: string;
  // Add other properties that might be in parsed URLs
}

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
    folderId: string,
    exportFormat: ExportFormat | null,
    parsedUrls: ParsedUrlType[],
    selectedTabs: chrome.tabs.Tab[],
    callback: () => void
  ) => Promise<boolean>;
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
    handleFolderSelect
  } = useBookmarkOperations();

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
    handleFolderSelect
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

// Home view component
function HomeView() {
  const navigate = useNavigate();
  const {
    selectedTabs,
    setUrlList,
    setExportFormat,
    bookmarkSuccess
  } = useAppContext();

  const bookmarkSelectedTabs = useCallback(() => {
    navigate('/folder-selector');
  }, [navigate]);

  const toggleUrlInput = useCallback(() => {
    navigate('/url-input');
  }, [navigate]);

  const handleExportFormatSelect = useCallback((format: ExportFormat) => {
    setExportFormat(format);
    navigate('/folder-selector');
  }, [setExportFormat, navigate]);

  return (
    <div className="mb-2 mx-2">
      <h2 className='text-xl text-orange-500 dark:text-orange-500 text-left font-extrabold border-b border-gray-200 dark:border-gray-700 mb-1'>Links to Bookmarks v1.0</h2>
      <StatusMessage message={bookmarkSuccess} />

      <SelectedTabs
        selectedTabs={selectedTabs}
        onBookmarkTabs={bookmarkSelectedTabs}
      />

      <BookmarkListAction
        onToggleUrlInput={toggleUrlInput}
      />

      <BookmarkSelAction
        setShowUrlInput={() => navigate('/url-input')}
        setUrlList={setUrlList}
      />

      <div className="mt-3">
        <ExportDropdown onSelectFormat={handleExportFormatSelect} />
      </div>
    </div>
  );
}

// Folder selector view component
function FolderSelectorView() {
  const navigate = useNavigate();
  const {
    parsedUrls,
    clearParsedUrls,
    selectedTabs,
    exportFormat,
    clearExportFormat,
    handleFolderSelect,
    bookmarkSuccess
  } = useAppContext();

  const handleFolderSelectCancel = useCallback(() => {
    clearExportFormat();
    if (parsedUrls.length > 0) {
      navigate('/url-input');
    } else {
      navigate('/');
    }
  }, [parsedUrls.length, clearExportFormat, navigate]);

  const handleConfirmFolderSelect = useCallback(async (folderId: string) => {
    const success = await handleFolderSelect(
      folderId,
      exportFormat,
      parsedUrls,
      selectedTabs,
      () => {
        clearParsedUrls();
      }
    );

    if (success) {
      clearExportFormat();
      navigate('/');
    }
  }, [
    handleFolderSelect,
    exportFormat,
    parsedUrls,
    selectedTabs,
    clearParsedUrls,
    clearExportFormat,
    navigate
  ]);

  return (
    <>
      <StatusMessage message={bookmarkSuccess} />
      <BookmarkTree
        mode="select"
        onSelectFolder={handleConfirmFolderSelect}
        onCancel={handleFolderSelectCancel}
        source={!!exportFormat}
      />
    </>
  );
}

// URL input view component
function UrlInputView() {
  const navigate = useNavigate();
  const {
    urlList,
    setUrlList,
    parseUrls,
    setBookmarkSuccess,
    bookmarkSuccess
  } = useAppContext();

  const handleUrlInputSubmit = useCallback(() => {
    if (parseUrls()) {
      navigate('/folder-selector');
    } else {
      setBookmarkSuccess("Error parsing URLs");
      setTimeout(() => setBookmarkSuccess(null), 3000);
    }
  }, [parseUrls, setBookmarkSuccess, navigate]);

  const handleUrlInputCancel = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <>
      <StatusMessage message={bookmarkSuccess} />
      <UrlInput
        urlList={urlList}
        setUrlList={setUrlList}
        onCancel={handleUrlInputCancel}
        onSubmit={handleUrlInputSubmit}
      />
    </>
  );
}

// Main App component
function App() {
  return (
    <HashRouter>
      <AppProvider>
        <div className="flex flex-col h-full min-h-[400px]">
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route path="/folder-selector" element={<FolderSelectorView />} />
              <Route path="/url-input" element={<UrlInputView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AppProvider>
    </HashRouter>
  );
}

export default App;