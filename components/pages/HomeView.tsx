import { useNavigate } from "react-router-dom";
import { useAppContext } from "../AppProvider";
import ImportBookmarks from "../ImportBookmarks";

export default function HomeView() {
  const navigate = useNavigate();
  const {
    selectedTabs,
    setUrlList,
    bookmarkSuccess,
    bookmarkOperations,
    setFolderSelectHandler,
  } = useAppContext();

  const handleImportBookmarks = useCallback((bookmarks: chrome.bookmarks.BookmarkTreeNode[]) => {
    bookmarkOperations.setImportedBookmarks(bookmarks);
    setFolderSelectHandler(() => (folderIds: string[]) => {
      console.log('Importing bookmarks:', folderIds, bookmarks);
        bookmarkOperations.handlers.handleBookmarkImport(
          folderIds, 
            {
                bookmarks,
                onSuccess: () => {
                    setUrlList('');
                    navigate('/');
                }
            }
        );
    });
    navigate('/folder-selector');
  }, [bookmarkOperations, setUrlList, navigate, setFolderSelectHandler]);

  const bookmarkSelectedTabs = useCallback(() => {
    // Set handler for bookmarking tabs
    // folderHandler.setAddBookmarksHandler('tabs');
    // setFolderSelectHandler(bookmarkOperations.handlers.handleAddBookmarks);
    setFolderSelectHandler(() => (folderIds: string[]) => {
        bookmarkOperations.handlers.handleAddTabsAsBookmarks(
            folderIds, 
            {
                items: selectedTabs,
                onSuccess: () => {
                    navigate('/');
                }
            }
        );
    });
    navigate('/folder-selector');
  }, [selectedTabs, bookmarkOperations.handlers.handleAddTabsAsBookmarks, navigate]);

  const toggleUrlInput = useCallback(() => {
    navigate('/url-input');
  }, [navigate]);

  const handleExportFormatSelect = useCallback((format: ExportFormat) => {
    bookmarkOperations.setExportFormat(format);
    setFolderSelectHandler(() => (folderIds: string[]) => {
        console.log('Exporting bookmarks:', folderIds, format);
        bookmarkOperations.handlers.handleBookmarkExport(
            folderIds, 
            {
                format: format,
                onSuccess: () => {
                    navigate('/');
                }
            }
        );
    });
    console.log("Exporting bookmarks with format:", format);

    navigate('/folder-selector');
  }, [bookmarkOperations, navigate, setFolderSelectHandler]);

  return (
    <div className="mb-2 mx-2">
      <h2 className='text-xl text-orange-500 dark:text-orange-500 text-left font-extrabold border-b border-gray-200 dark:border-gray-700 mb-1'>Links to Bookmarks v1.0</h2>
      {bookmarkSuccess && <StatusMessage message={bookmarkSuccess} />}

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