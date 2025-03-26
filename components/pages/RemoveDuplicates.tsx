import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppProvider';
import { getAllBookmarks, removeDuplicateBookmarks } from '@/hooks/useBookmarkOperations';

export function RemoveDuplicatesButton() {
    const navigate = useNavigate();
    const startIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 4v16a1 1 0 0 0 1.6.8L12 16l5.4 4.8a1 1 0 0 0 1.6-.8V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" opacity="0.5" />
        <path d="M9 2v16a1 1 0 0 0 1.6.8L16 14l5.4 4.8a1 1 0 0 0 1.6-.8V2a2 2 0 0 0-2-2H11a2 2 0 0 0-2 2z" />
        <line x1="4" y1="20" x2="20" y2="4" stroke="#FF4444" strokeWidth="2.5" />
    </svg>
    return (
        <div className="flex justify-center gap-2 mt-3">
            <Button 
        variant="primary"
        fullWidth
        startIcon={startIcon}
            onClick={() => navigate('/remove-duplicates')}
        >
            Remove Duplicate Bookmarks
        </Button>
      </div>
    );
}

interface DuplicateRemovalResult {
  removedCount: number;
  processedCount: number;
  folders: { id: string; name: string }[];
}

const RemoveDuplicatesView: React.FC = () => {
  const navigate = useNavigate();
  const { setFolderSelectHandler, bookmarkOperations } = useAppContext();
  const [result, setResult] = useState<DuplicateRemovalResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectFolders = useCallback(() => {
    setFolderSelectHandler(() => async (folderIds: string[]) => {
      if (!folderIds.length) {
        navigate('/');
        return;
      }

      setIsProcessing(true);
      try {
        // Get folder names for display
        const folderDetails = await Promise.all(
          folderIds.map(async (id) => {
            const folder = await browser.bookmarks.get(id);
            return { id, name: folder[0]?.title || 'Unknown folder' };
          })
        );

        // Find and remove duplicates
        const bookmarks = await getAllBookmarks(folderIds);
        const { removedCount, processedCount } = await removeDuplicateBookmarks(bookmarks);
        
        setResult({
          removedCount,
          processedCount,
          folders: folderDetails
        });
      } catch (error) {
        console.error('Error removing duplicates:', error);
      } finally {
        setIsProcessing(false);
      }
    });

    navigate('/folder-selector');
  }, [bookmarkOperations, navigate, setFolderSelectHandler]);

  return (
    <div className="mb-2 mx-2">
      <h2 className="text-xl text-orange-500 dark:text-orange-500 text-left font-extrabold border-b border-gray-200 dark:border-gray-700 mb-3">
        Remove Duplicate Bookmarks
      </h2>
  
      {!result ? (
        <div className="mb-4">
          <p className="mb-2">
            This tool helps you clean up your bookmarks by removing duplicates from selected folders.
          </p>
          <p className="mb-4">
            Duplicates are identified by matching URLs, and only one bookmark will be kept for each unique URL.
          </p>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
          <h3 className="font-bold mb-2">Results</h3>
          <p>
            Processed <span className="font-semibold">{result.processedCount}</span> bookmarks
          </p>
          <p>
            Removed <span className="font-semibold text-orange-500">{result.removedCount}</span> duplicates
          </p>
          <div className="mt-2 mb-4">
            <p className="font-semibold">From folders:</p>
            <ul className="list-disc list-inside">
              {result.folders.map(folder => (
                <li key={folder.id}>{folder.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
  
      {/* Buttons with Back on left, action button on right */}
      <div className="flex justify-between">
        <Button
          onClick={() => navigate('/')}
          variant='danger'
        >
          Cancel
        </Button>
        
        {!result ? (
          <Button
            onClick={handleSelectFolders}
            variant='success'
          >
            Select Folders
          </Button>
        ) : (
          <Button
            onClick={() => setResult(null)}
            variant='primary'
          >
            Clean Up More Folders
          </Button>
        )}
      </div>
  
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <p className="text-center">Removing duplicates...</p>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded overflow-hidden">
              <div className="bg-blue-500 h-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoveDuplicatesView;