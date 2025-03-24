import React, { useState, useCallback } from 'react';
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

function App() {
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  
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

  const bookmarkSelectedTabs = useCallback(() => {
    setShowFolderSelector(true);
  }, []);

  const toggleUrlInput = useCallback(() => {
    setShowUrlInput(prev => !prev);
  }, []);

  const handleUrlInputSubmit = useCallback(() => {
    if (parseUrls()) {
      setShowUrlInput(false);
      setShowFolderSelector(true);
    } else {
      setBookmarkSuccess("Error parsing URLs");
      setTimeout(() => setBookmarkSuccess(null), 3000);
    }
  }, [parseUrls, setBookmarkSuccess]);

  const handleUrlInputCancel = useCallback(() => {
    setShowUrlInput(false);
  }, []);

  const handleFolderSelectCancel = useCallback(() => {
    setShowFolderSelector(false);
    clearExportFormat();
    if (parsedUrls.length > 0) {
      setShowUrlInput(true);
    }
  }, [parsedUrls.length, clearExportFormat]);

  const handleExportFormatSelect = useCallback((format: ExportFormat) => {
    setExportFormat(format);
    setShowFolderSelector(true);
  }, [setExportFormat]);

  const handleConfirmFolderSelect = useCallback(async (folderId: string) => {
    const success = await handleFolderSelect(
      folderId, 
      exportFormat, 
      parsedUrls,
      selectedTabs,
      () => {
        clearParsedUrls();
        setShowUrlInput(false);
      }
    );
    
    if (success) {
      setShowFolderSelector(false);
      clearExportFormat();
    }
  }, [
    handleFolderSelect, 
    exportFormat, 
    parsedUrls, 
    selectedTabs, 
    clearParsedUrls, 
    clearExportFormat
  ]);

  if (showFolderSelector) {
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

  if (showUrlInput) {
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

  return (
    <div className="mb-2 mx-2">
      <StatusMessage message={bookmarkSuccess} />
      <h2 className='text-lg text-gray-800 dark:text-white'>Links to Bookmarks</h2>

      <SelectedTabs 
        selectedTabs={selectedTabs} 
        onBookmarkTabs={bookmarkSelectedTabs} 
      />
      
      <BookmarkListAction 
        onToggleUrlInput={toggleUrlInput} 
      />

      <BookmarkSelAction setShowUrlInput={setShowUrlInput} setUrlList={setUrlList} />
      
      <div className="mt-3">
        <ExportDropdown onSelectFormat={handleExportFormatSelect} />
      </div>
    </div>
  );
}

export default App;