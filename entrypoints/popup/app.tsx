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
import ImportBookmarks from '@/components/ImportBookmarks';
// Define types for our context

// Home view component
function HomeView() {
  const navigate = useNavigate();
  const {
    selectedTabs,
    setUrlList,
    setExportFormat,
    bookmarkSuccess,
    setImportedBookmarks
  } = useAppContext();

  const handleImportBookmarks = useCallback((bookmarks: chrome.bookmarks.BookmarkTreeNode[]) => {
    setImportedBookmarks(bookmarks);
    navigate('/folder-selector');
  }, [setImportedBookmarks]);

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

      <ImportBookmarks onImport={handleImportBookmarks} />

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
    clearImportedBookmarks,
    handleFolderSelect,
    bookmarkSuccess,
    importedBookmarks
  } = useAppContext();

  const handleFolderSelectCancel = useCallback(() => {
    clearExportFormat();
    console.log('Clearing imported bookmarks');
    clearImportedBookmarks();
    if (parsedUrls.length > 0) {
      navigate('/url-input');
    } else {
      navigate('/');
    }
  }, [parsedUrls.length, clearExportFormat, navigate]);

  const handleConfirmFolderSelect = useCallback(async (folderIds: string[]) => {
    const success = await handleFolderSelect(
      folderIds,
      exportFormat,
      importedBookmarks,
      parsedUrls,
      selectedTabs,
      () => {
        clearParsedUrls();
      }
    );

    if (success) {
      clearExportFormat();
      clearImportedBookmarks();
      console.log('Clearing imported bookmarks');
      navigate('/');
    }
  }, [
    handleFolderSelect,
    exportFormat,
    importedBookmarks,
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
        source={!!exportFormat || !!importedBookmarks}
        multiSelect={!!importedBookmarks}
        virtualBookmarks={importedBookmarks ?? undefined}
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