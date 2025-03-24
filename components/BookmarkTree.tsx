import React, { useState, useEffect } from 'react';

interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  dateAdded?: number;
  children?: BookmarkNode[];
}

interface BookmarkTreeProps {
  mode?: 'browse' | 'select'; // browse is default, select is for selecting a folder
  onSelectFolder?: (folderId: string) => void;
  onCancel?: () => void;
  visible?: boolean;
}

export default function BookmarkTree({
  mode = 'browse',
  onSelectFolder,
  onCancel,
  visible = true
}: BookmarkTreeProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[] | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState<string | null>(null); // ID of parent folder where we're creating a new folder
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const result = await chrome.bookmarks.getTree();
        setBookmarks(result);
        
        // Auto-expand root folders in selection mode
        if (mode === 'select' && result && result[0]?.children) {
          const rootFolderIds = result[0].children
            .filter(node => !node.url)
            .map(node => node.id);
          setExpandedFolders(new Set(rootFolderIds));
        }
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      }
    };
    
    fetchBookmarks();
  }, [mode]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId);
  };
  
  const handleConfirmSelection = () => {
    if (selectedFolder && onSelectFolder) {
      onSelectFolder(selectedFolder);
    }
  };

  const startCreateFolder = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder selection/expansion
    setCreatingFolder(parentId);
    setNewFolderName('');
    
    // Make sure the parent folder is expanded
    if (!expandedFolders.has(parentId)) {
      toggleFolder(parentId);
    }
  };

  const cancelCreateFolder = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCreatingFolder(null);
    setNewFolderName('');
  };

  const confirmCreateFolder = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (!creatingFolder || !newFolderName.trim()) {
      cancelCreateFolder();
      return;
    }
    
    try {
      // Create the folder using Chrome bookmarks API
      const newFolder = await chrome.bookmarks.create({
        parentId: creatingFolder,
        title: newFolderName.trim()
      });
      
      // Refresh bookmarks
      const result = await chrome.bookmarks.getTree();
      setBookmarks(result);
      
      // Clear the input and creation state
      setCreatingFolder(null);
      setNewFolderName('');
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      confirmCreateFolder();
    } else if (e.key === 'Escape') {
      cancelCreateFolder();
    }
  };

  const renderBookmarkItem = (node: BookmarkNode) => {
    const isFolder = !node.url;
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFolder === node.id;
    const childCount = node.children?.length || 0;
    
    // In select mode, only show folders
    if (mode === 'select' && !isFolder) {
      return null;
    }
    
    return (
      <li key={node.id} className={`mb-0.5 text-left ${isSelected ? 'bg-blue-100 dark:bg-blue-900 rounded-md' : ''}`}>
        {isFolder ? (
          <>
            <div className="flex w-full">
            <div 
                className={`flex flex-grow items-center p-1 rounded-l cursor-pointer transition-colors duration-200 
                ${isSelected ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                ${isExpanded ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                onClick={() => {
                handleFolderSelect(node.id);
                if (mode === 'browse') {
                    toggleFolder(node.id);
                }
                }}
                onDoubleClick={() => {
                if (mode === 'select') {
                    toggleFolder(node.id);
                }
                }}
            >
                <span className="folder-icon mr-1 text-xs">{isExpanded ? '📂' : '📁'}</span>
                <span className="folder-title text-xs font-medium">{node.title}</span>
                <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">[{childCount}]</span>
                {mode === 'select' && isSelected && (
                <span className="ml-auto text-xs text-blue-600">✓</span>
                )}
            </div>
            <button 
                className="cursor-pointer bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 hover:dark:bg-gray-800 text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-1 py-0.5 border border-slate-200 dark:border-slate-700 active:bg-gray-300 dark:active:bg-gray-700 rounded-r"
                onClick={(e) => startCreateFolder(node.id, e)}
                title="Create new folder"
            >
                📁+
            </button>
            </div>
            
            {isExpanded && (
              <ul className="folder-children pl-3 mt-0.5 border-l border-gray-200 dark:border-gray-700">
                {creatingFolder === node.id && (
                  <li className="flex items-center p-1 mt-1 mb-1">
                    <span className="folder-icon mr-1 text-xs">📁</span>
                    <input
                      type="text"
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 flex-grow"
                      placeholder="New folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      autoFocus
                    />
                    <button
                      className="ml-1 text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 px-1 py-0.5"
                      onClick={confirmCreateFolder}
                      title="Confirm"
                    >
                      ✓
                    </button>
                    <button
                      className="ml-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 px-1 py-0.5"
                      onClick={cancelCreateFolder}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </li>
                )}
                {node.children?.map(child => renderBookmarkItem(child)).filter(Boolean)}
              </ul>
            )}
          </>
        ) : (
          <div className="bookmark py-1 px-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
            <a 
              href={node.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <span className="mr-1 text-xs">🔗</span>
              <span className="truncate">{node.title || node.url}</span>
            </a>
          </div>
        )}
      </li>
    );
  };

  if (!visible) return null;

  return (
    <div className="bookmark-tree bg-white dark:bg-gray-900 p-2 rounded-lg shadow-md w-full">
      <h2 className="text-sm font-bold mb-2 text-left text-gray-800 dark:text-gray-100">
        {mode === 'select' ? 'Select Destination Folder' : 'Bookmarks'}
      </h2>
      
      {bookmarks === null ? (
        <div className="error-message bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800 text-left">
          <p className="text-xs text-red-700 dark:text-red-400">Could not access bookmarks. Ensure the extension has been granted this permission.</p>
          <a 
            href="chrome://extensions/?id=${chrome.runtime.id}" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-1 inline-block bg-gray-800 text-gray-800 dark:text-white px-2 py-1 text-xs rounded-md hover:bg-gray-700 active:bg-gray-600 transition-colors duration-200"
          >
            Open extension permissions
          </a>
          <p className="help-text mt-1 text-xs text-gray-600 dark:text-gray-400">
            Enable the "Bookmarks" permission and refresh this page.
          </p>
        </div>
      ) : bookmarks.length === 0 ? (
        <p className="no-bookmarks text-xs text-gray-600 dark:text-gray-400 text-left">No bookmarks found.</p>
      ) : (
        <>
          <div className={`max-h-${mode === 'select' ? '60' : '96'} overflow-y-auto pr-1 custom-scrollbar`}>
            <ul className="root-bookmarks text-left space-y-0.5">
              {bookmarks.map(node => node.children?.map(renderBookmarkItem).filter(Boolean))}
            </ul>
          </div>
          
          {mode === 'select' && (
            <div className="mt-3 flex justify-end space-x-2 border-t pt-2">
              <button
                onClick={onCancel}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedFolder}
                className={`px-3 py-1 text-xs text-gray-800 dark:text-white rounded transition-colors ${
                  selectedFolder 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-blue-300 cursor-not-allowed'
                }`}
              >
                Add Bookmarks
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}