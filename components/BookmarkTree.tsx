import React, { useState, useEffect } from 'react';
import Button from './Button';

interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  dateAdded?: number;
  children?: BookmarkNode[];
}

interface BookmarkTreeProps {
  mode?: 'browse' | 'select'; // browse is default, select is for selecting a folder
  onSelectFolder?: (folderIds: string[]) => void; // Changed to array for multi-select
  onCancel?: () => void;
  visible?: boolean;
  source?: boolean;
  virtualBookmarks?: BookmarkNode[]; // Optional virtual bookmarks tree
  multiSelect?: boolean; // Enable multi-selection capability
  selectAllByDefault?: boolean; // Whether to select all folders by default
}

export default function BookmarkTree({
  mode = 'browse',
  onSelectFolder,
  onCancel,
  visible = true,
  source = false,
  virtualBookmarks = undefined,
  multiSelect = false,
  selectAllByDefault = false
}: BookmarkTreeProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[] | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState<string | null>(null); // ID of parent folder where we're creating a new folder
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        if (virtualBookmarks) {
          setBookmarks(virtualBookmarks);
        } else {
          const result = await browser.bookmarks.getTree();
          setBookmarks(result);
        }

        // Auto-expand root folders in selection mode
        if (mode === 'select' && bookmarks && bookmarks[0]?.children) {
          const rootFolderIds = bookmarks[0].children
            .filter(node => !node.url)
            .map(node => node.id);
          setExpandedFolders(new Set(rootFolderIds));
        }
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      }
    };

    fetchBookmarks();
  }, [mode, virtualBookmarks]);

  // Select all folders by default if specified
  useEffect(() => {
    if (selectAllByDefault && bookmarks && mode === 'select') {
      const allFolderIds = new Set<string>();

      const collectFolderIds = (nodes: BookmarkNode[]) => {
        for (const node of nodes) {
          if (!node.url) {
            allFolderIds.add(node.id);
            if (node.children && node.children.length > 0) {
              collectFolderIds(node.children);
            }
          }
        }
      };

      if (bookmarks.length > 0 && bookmarks[0].children) {
        collectFolderIds(bookmarks[0].children);
      }

      setSelectedFolders(allFolderIds);
    }
  }, [bookmarks, selectAllByDefault, mode]);

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

  const handleFolderSelect = (folderIds: string[], e?: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    if (e && multiSelect) e.stopPropagation(); // Don't toggle expansion on checkbox click

    if (multiSelect) {
      setSelectedFolders(prev => {
        const newSet = new Set(prev);
        folderIds.forEach(folderId => {
          if (newSet.has(folderId)) {
            // Unselect this folder and all its children
            newSet.delete(folderId);
            if (bookmarks) unselectChildFolders(folderId, bookmarks, newSet);
          }
          else {
            // Select this folder
            newSet.add(folderId);
          }
        });
        return newSet;
      });
    } else {
      // Single select mode
      setSelectedFolders(new Set(folderIds));
    }
  };

  // Recursive function to find and unselect all child folders
  const unselectChildFolders = (parentId: string, nodes: BookmarkNode[], selectedSet: Set<string>) => {
    for (const node of nodes) {
      if (node.id === parentId && node.children) {
        for (const child of node.children) {
          if (!child.url) { // It's a folder
            selectedSet.delete(child.id);
            if (child.children) {
              unselectChildFolders(child.id, [child], selectedSet);
            }
          }
        }
        return;
      }

      if (node.children) {
        unselectChildFolders(parentId, node.children, selectedSet);
      }
    }
  };

  const handleConfirmSelection = () => {
    if (selectedFolders.size > 0 && onSelectFolder) {
      onSelectFolder(Array.from(selectedFolders));
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
      if (virtualBookmarks) {
        // Handle creating folders in virtual bookmarks
        // This would need to be implemented based on how virtualBookmarks are managed
        console.warn("Creating folders in virtual bookmarks not implemented");
        // You would then update the virtualBookmarks state accordingly
      } else {
        // Create the folder using Chrome bookmarks API
        const newFolder = await browser.bookmarks.create({
          parentId: creatingFolder,
          title: newFolderName.trim()
        });

        // Refresh bookmarks
        const result = await browser.bookmarks.getTree();
        setBookmarks(result);
      }

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

  const renderBookmarkItem = (node: BookmarkNode, mode: 'browse' | 'select') => {
    const isFolder = !node.url;
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFolders.has(node.id);
    const childCount = node.children?.length || 0;

    // In select mode, only show folders
    if (mode === 'select' && !isFolder) {
      return null;
    }

    return (
      <li key={node.id} className={`mb-0.5 text-left ${isSelected && !multiSelect ? 'bg-blue-100 dark:bg-blue-900 rounded-md' : ''}`}>
        {isFolder ? (
          <>
            <div className="flex w-full">
              <div
                className={`border rounded-l dark:border-slate-200/25 border-slate-800/25 border-r-0 flex flex-grow items-center p-1 rounded-l cursor-pointer transition-colors duration-200 
                ${isSelected && !multiSelect ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                ${isExpanded ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                onClick={() => {
                  if (!multiSelect) handleFolderSelect([node.id]);
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
                {multiSelect && mode === 'select' && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    className="mr-1"
                    onChange={(e) => handleFolderSelect([node.id], e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <span className="folder-icon mr-1 text-xs">{isExpanded ? '📂' : '📁'}</span>
                <span className="folder-title text-xs font-medium">{node.title}</span>
                <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">[{childCount}]</span>
                {mode === 'select' && isSelected && !multiSelect && (
                  <span className="ml-auto text-xs text-blue-600">✓</span>
                )}
              </div>
              {!virtualBookmarks && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => startCreateFolder(node.id, e)}
                  title="Create new folder"
                  className="rounded-l-none rounded-r"
                >
                  📁+
                </Button>
              )}
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
                    <Button
                      size="sm"
                      variant="success"
                      onClick={confirmCreateFolder}
                      title="Confirm"
                      className="ml-1 m-0 p-0"
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={cancelCreateFolder}
                      title="Cancel"
                      className="ml-1 m-0 p-0"
                    >
                      ✕
                    </Button>
                  </li>
                )}
                {node.children?.map(child => renderBookmarkItem(child, mode)).filter(Boolean)}
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
    <div className="mb-2 mx-2">
      <h2 className="text-xl text-orange-500 dark:text-orange-500 text-left font-extrabold border-b border-gray-200 dark:border-gray-700 mb-1">
        {mode === 'select' ? `Select ${multiSelect ? '' : 'a '}${source ? "source" : "destination"} folder${multiSelect ? 's' : ''}` : 'bookmarks'}
      </h2>
      <div className="">
        <p className='text-xs text-left'>Double click to open folders</p>
        {bookmarks === null ? (
          <div className="error-message bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800 text-left">
            <p className="text-xs text-red-700 dark:text-red-400">Could not access bookmarks. Ensure the extension has been granted this permission.</p>
            {!virtualBookmarks && (
              <>
                <a
                  href={`chrome://extensions/?id=${browser.runtime.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block bg-gray-800 text-gray-800 dark:text-white px-2 py-1 text-xs rounded-md hover:bg-gray-700 active:bg-gray-600 transition-colors duration-200"
                >
                  Open extension permissions
                </a>
                <p className="help-text mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Enable the "Bookmarks" permission and refresh this page.
                </p>
              </>
            )}
          </div>
        ) : bookmarks.length === 0 ? (
          <p className="no-bookmarks text-xs text-gray-600 dark:text-gray-400 text-left">No bookmarks found.</p>
        ) : (
          <>
            <div className={`max-h-${mode === 'select' ? '60' : '96'} overflow-y-auto pr-1 custom-scrollbar`}>
              <ul className="root-bookmarks text-left space-y-0.5">
                {bookmarks.map(node => node.children?.map(f => renderBookmarkItem(f, mode)).filter(Boolean))}
              </ul>
            </div>

            {mode === 'select' && (
              <div className="flex justify-between mt-3 border-t pt-2 border-gray-200 dark:border-gray-700">
                <Button
                  variant='danger'
                  onClick={onCancel}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  variant='success'
                  onClick={handleConfirmSelection}
                  disabled={selectedFolders.size === 0}
                  className={`px-3 py-1 text-xs text-gray-800 dark:text-white rounded transition-colors ${selectedFolders.size > 0
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-blue-300 cursor-not-allowed'
                    }`}
                >
                  {source ? "Copy Bookmarks" : `Add Bookmarks${multiSelect ? ' to Selected Folders' : ''}`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}