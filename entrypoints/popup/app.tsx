import { useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './app.css';
import BookmarkTree from '../../components/BookmarkTree';
import StatusMessage from '../../components/StatusMessage';
import SelectedTabs from '../../components/SelectedTabs';
import UrlInput from '../../components/UrlInput';
import ExportDropdown, { ExportFormat } from '../../components/ExportDropdown';
import BookmarkListAction from '../../components/BookmarkListAction';
import BookmarkSelAction from '@/components/BookmarkSelAction';
import Footer from '@/components/Footer';
import ImportBookmarks from '@/components/ImportBookmarks';
import { AppProvider, useAppContext } from '@/components/AppProvider';
import UrlInputView from '@/components/pages/UrlInputView';
import FolderSelectorView from '@/components/pages/FolderSelectorView';
import HomeView from '@/components/pages/HomeView';
import RemoveDuplicatesView from '@/components/pages/RemoveDuplicates';

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
              <Route path="/remove-duplicates" element={<RemoveDuplicatesView />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AppProvider>
    </HashRouter>
  );
}

export default App;