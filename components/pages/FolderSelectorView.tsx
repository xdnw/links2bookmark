import { useNavigate } from "react-router-dom";

// Folder selector view component
export default function FolderSelectorView() {
    const navigate = useNavigate();
    const {
      parsedUrls,
      clearParsedUrls,
      selectedTabs,
      bookmarkOperations,
      folderSelectHandler,
      bookmarkSuccess
    } = useAppContext();
  
    const handleFolderSelectCancel = useCallback(() => {
      // Clear any active handlers
      bookmarkOperations.clearExportFormat();
      bookmarkOperations.setImportedBookmarks(undefined);
      
      if (parsedUrls.length > 0) {
        navigate('/url-input');
      } else {
        navigate('/');
      }
    }, [parsedUrls.length, bookmarkOperations, navigate]);

    console.log('FolderSelectorView');
  
    return (
      <>
        {bookmarkSuccess && <StatusMessage message={bookmarkSuccess} />}
        <BookmarkTree
          mode="select"
          onSelectFolder={folderSelectHandler}
          onCancel={handleFolderSelectCancel}
          source={!!bookmarkOperations.exportFormat || !!bookmarkOperations.importedBookmarks}
          multiSelect={!!bookmarkOperations.importedBookmarks}
          virtualBookmarks={bookmarkOperations.importedBookmarks ?? undefined}
        />
      </>
    );
}