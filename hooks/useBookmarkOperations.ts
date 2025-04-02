import { ExportFormat } from '@/components/ExportDropdown';
import { useState, useCallback } from 'react';
import { toYoutubePlaylist } from './youtube';
import { Bookmarks, Tabs } from 'wxt/browser';

export async function removeDuplicateBookmarks(bookmarks: Bookmarks.BookmarkTreeNode[]): Promise<{
  removedCount: number;
  processedCount: number;
}> {
  const uniqueUrls = new Map<string, Bookmarks.BookmarkTreeNode>();
  const duplicates: Bookmarks.BookmarkTreeNode[] = [];
  
  // Find duplicates
  bookmarks.forEach(bookmark => {
    if (!bookmark.url) return;
    
    if (uniqueUrls.has(bookmark.url)) {
      duplicates.push(bookmark);
    } else {
      uniqueUrls.set(bookmark.url, bookmark);
    }
  });
  
  // Remove duplicates
  for (const bookmark of duplicates) {
    await browser.bookmarks.remove(bookmark.id);
  }
  
  return {
    removedCount: duplicates.length,
    processedCount: bookmarks.length
  };
}

// Helper function to recursively get all bookmarks from multiple folders
export const getAllBookmarks = async (folderIds: string[]): Promise<Bookmarks.BookmarkTreeNode[]> => {
  let allBookmarks: Bookmarks.BookmarkTreeNode[] = [];

  // Process each folder
  for (const folderId of folderIds) {
    const children = await browser.bookmarks.getChildren(folderId);
    if (!children) continue;

    for (const child of children) {
      if (child.url) {
        // This is a bookmark, add it to the list
        allBookmarks.push(child);
      } else {
        // This is a folder, recursively get its bookmarks
        const nestedBookmarks = await getAllBookmarks([child.id]);
        allBookmarks = allBookmarks.concat(nestedBookmarks);
      }
    }
  }

  return allBookmarks;
};

export type FolderSelectHandler<T> = (folderIds: string[], options: T) => Promise<boolean>;

export const useBookmarkOperations = () => {
  const [bookmarkSuccess, setBookmarkSuccess] = useState<string | undefined>(undefined);
  const [exportFormat, setExportFormat] = useState<ExportFormat | undefined>(undefined);
  const [importedBookmarks, setImportedBookmarks] = useState<Bookmarks.BookmarkTreeNode[] | undefined>(undefined);

  const showSuccess = useCallback((message: string) => {
    setBookmarkSuccess(message);
    setTimeout(() => setBookmarkSuccess(undefined), 3000);
  }, []);
  
  const showError = useCallback((error: any) => {
    console.error("Bookmark operation error:", error);
    setBookmarkSuccess(`Error: ${error}`);
    setTimeout(() => setBookmarkSuccess(undefined), 3000);
    return false;
  }, []);

  const handleBookmarkImport: FolderSelectHandler<{ 
    bookmarks: Bookmarks.BookmarkTreeNode[], onSuccess?: () => void 
  }> = useCallback(async (
    folderIds: string[],
    options: { 
      bookmarks: Bookmarks.BookmarkTreeNode[],
      onSuccess?: () => void 
    }
  ): Promise<boolean> => {
    try {
      const { bookmarks, onSuccess } = options;
      
      if (folderIds.length === 0) {
        return showError("No destination folder selected");
      }
      
      // Cache structure to avoid repeated API calls
      const folderCache = new Map<string, {
        bookmarkSet: Set<string>,
        folderMap: Map<string, string>
      }>();

      // Map<string, Set<string>> parents - builds a complete ancestry map for each bookmark
      const parentsCache = new Map<string, Set<string>>();
      const buildParentsCache = (
        items: Bookmarks.BookmarkTreeNode[], 
        parentId?: string
      ): void => {
        for (const item of items) {
          // Initialize set for this node if needed
          if (!parentsCache.has(item.id)) {
            parentsCache.set(item.id, new Set<string>());
          }
          
          // Add direct parent if it exists
          if (parentId) {
            parentsCache.get(item.id)!.add(parentId);
            
            // Add all ancestors of the parent (transitively)
            const parentAncestors = parentsCache.get(parentId);
            if (parentAncestors) {
              for (const ancestor of parentAncestors) {
                parentsCache.get(item.id)!.add(ancestor);
              }
            }
          }
          
          // Recursively process children
          if (item.children && item.children.length > 0) {
            buildParentsCache(item.children, item.id);
          }
        }
      };

      // // Initialize and build the parents cache
      // buildParentsCache(bookmarks);
      // const childsCache = new Map<string, Set<string>>();
      // const buildChildsCache = (items: Bookmarks.BookmarkTreeNode[], parentId?: string): void => {
      //   for (const item of items) {
      //     if (!childsCache.has(parentId!)) {
      //       childsCache.set(parentId!, new Set<string>());
      //     }
      //     childsCache.get(parentId!)!.add(item.id);
      //     if (item.children && item.children.length > 0) {
      //       buildChildsCache(item.children, item.id);
      //     }
      //   }
      // };
      // // Initialize and build the childs cache
      // buildChildsCache(bookmarks);
      
      // // Set of valid folder IDs in the browser (selected folders and their descendants)
      const validFolderIds = new Set<string>(folderIds);
      // iterate over folderIds and add all parents
      for (const folderId of folderIds) {
        const ancestors = parentsCache.get(folderId);
        if (ancestors) {
          for (const ancestor of ancestors) {
            validFolderIds.add(ancestor);
          }
        }
      }
      
      // Prefetch folder contents and build lookup structures
      const prefetchFolderContents = async (folderId: string) => {
        if (folderCache.has(folderId)) return;
        try {
          const children = await browser.bookmarks.getChildren(folderId);
          const bookmarkSet = new Set<string>();
          const folderMap = new Map<string, string>();

          for (const child of children) {
            if (child.url) {
              // This is a bookmark
              bookmarkSet.add(`${child.url}|${child.title}`);
            } else {
              // This is a folder
              folderMap.set(child.title, child.id);
            }
          }

          folderCache.set(folderId, { bookmarkSet, folderMap });
        } catch (error) {}
      };

      const validFileParentIds = new Set(folderIds);

      const createBookmarksRecursively = async (
        items: Bookmarks.BookmarkTreeNode[],
        parentId?: string,
        skipDuplicateCheck: boolean = false
      ) => {
        try {
        // If we have a parent and need to check for duplicates, prefetch its contents
        if (parentId && !skipDuplicateCheck) {
          try {
          await prefetchFolderContents(parentId);
          } catch (error) {
            console.error("Error prefetching folder contents:", error);
            throw error;
          }
        }

        for (const item of items) {
          // if (item.type === "separator") {
          //   continue;
          // }
          // if (item.type === "folder") {
          //   if (!validFolderIds.has(item.id)) {
          //     console.log(`Skipping folder: ${item.title || "Imported Folder"}`);
          //     continue; // Skip this folder
          //   }
          // } else if (item.type === "bookmark") {
          //   if (!item.parentId || !validFileParentIds.has(item.parentId)) {
          //     console.log(`Skipping bookmark: ${item.title || "Unnamed Bookmark"}`);
          //     continue;
          //   }
          // }
          if (item.url) {
            // This is a bookmark - check for duplicates unless in a newly created folder
            if (!skipDuplicateCheck && parentId) {
              const cacheEntry = folderCache.get(parentId);
              const bookmarkKey = `${item.url}|${item.title}`;

              if (cacheEntry?.bookmarkSet.has(bookmarkKey)) {
                console.log(`Skipping duplicate bookmark: ${item.title || new URL(item.url).hostname}`);
                continue; // Skip this bookmark
              }
            }

            console.log("Creating bookmark 1 with params:", {
              parentId: parentId,
              title: item.title || (item.url ? new URL(item.url).hostname : "Unnamed"),
              url: item.url,
              parentIdType: typeof parentId
            });
            await browser.bookmarks.create({
              parentId: parentId,
              title: item.title || new URL(item.url).hostname,
              url: item.url
            });

            // Update the cache since we added a new bookmark
            if (parentId && folderCache.has(parentId)) {
              const cacheEntry = folderCache.get(parentId)!;
              cacheEntry.bookmarkSet.add(`${item.url}|${item.title}`);
            }
          } else {
            // This is a folder - check if folder with same title already exists
            let folderId: string | undefined = undefined;
            let isNewlyCreated = false;

            if (parentId) {
              // Check if folder with same name exists using the cache
              const cacheEntry = folderCache.get(parentId);
              if (cacheEntry?.folderMap.has(item.title)) {
                console.log(`Using existing folder: ${item.title || "Imported Folder"}`);
                folderId = cacheEntry.folderMap.get(item.title);
              } else {
                console.log("Creating bookmark folder 3 with params:", {
                  parentId: parentId,
                  title: item.title || (item.url ? new URL(item.url).hostname : "Unnamed"),
                  url: item.url,
                  parentIdType: typeof parentId
                });
                const newFolder = await browser.bookmarks.create({
                  parentId: parentId,
                  title: item.title || "Imported Folder"
                });
                folderId = newFolder.id;
                isNewlyCreated = true;

                // Update the cache with the new folder
                if (cacheEntry) {
                  cacheEntry.folderMap.set(item.title, folderId);
                }
              }
            } else {
              // Top level folder
              // Prefetch top level folders if needed
              if (!folderCache.has("0")) {
                await prefetchFolderContents("0");
              }

              const cacheEntry = folderCache.get("0");
              if (cacheEntry?.folderMap.has(item.title)) {
                console.log(`Using existing top folder: ${item.title || "Imported Folder"}`);
                folderId = cacheEntry.folderMap.get(item.title);
              } else {
                console.log("Creating top bookmark folder with params:", {
                  parentId: parentId,
                  title: item.title || (item.url ? new URL(item.url).hostname : "Unnamed"),
                  url: item.url,
                  parentIdType: typeof parentId
                });
                const newFolder = await browser.bookmarks.create({
                  parentId: parentId,
                  title: item.title || "Imported Folder"
                });
                folderId = newFolder.id;
                isNewlyCreated = true;

                // Update the cache with the new folder
                if (cacheEntry) {
                  cacheEntry.folderMap.set(item.title, folderId);
                }
              }
            }

            // If it has children, process them
            if (item.children && item.children.length > 0 && folderId) {
              await createBookmarksRecursively(item.children, folderId, isNewlyCreated);
            }
          }
        }
      } catch (error) {
          console.error("Error creating bookmarks 2:", error);
          // Better error handling to get the full stack trace
          if (error instanceof Error) {
            console.error("Error message 2:", error.message);
            console.error("Stack trace 2:", error.stack);
          } else {
            console.error("Non-Error object thrown 2:", JSON.stringify(error));
          }
          throw error;
      }
      };

      // Start the import process with the selected folders
      console
      await createBookmarksRecursively(bookmarks[0].children as Bookmarks.BookmarkTreeNode[], undefined);
      
      if (onSuccess) {
        onSuccess();
      }
      
      showSuccess("Bookmarks successfully imported!");
      return true;
    } catch (error) {
      return showError(error);
    }
  }, [showSuccess, showError]);

    const handleBookmarkExport: FolderSelectHandler<{ format: ExportFormat, onSuccess?: () => void }> = useCallback(async (
      folderIds: string[],
      options: { format: ExportFormat, onSuccess?: () => void }
    ): Promise<boolean> => {
      try {
        const { format, onSuccess } = options;
        const items = await getAllBookmarks(folderIds);
        
        if (items.length === 0) {
          showError("No links found in folder");
          return false;
        }

        let message = (items.length === 1 ? "Link" : "Links") + " copied to clipboard!";
        let textToCopy = '';
        switch (format) {
          case 'urls':
            textToCopy = items.map(item => item.url).join('\n');
            break;
          case 'tsv':
            textToCopy = items.map(item => `${item.title}\t${item.url}`).join('\n');
            break;
          case 'csv':
            textToCopy = items.map(item => `"${item.title.replace(/"/g, '""')}","${item.url?.replace(/"/g, '""')}"`).join('\n');
            break;
          case 'markdown':
            textToCopy = items.map(item => `[${item.title}](${item.url})`).join('\n');
            break;
          case 'youtube': {
            const result = toYoutubePlaylist(items);
            if (result.success > 0) {
              textToCopy = result.result.join('\n');
              message = result.message;
            } else {
              setBookmarkSuccess(result.message);
              return false;
            }
            break;
          }
        }

        if (textToCopy.length === 0) {
          showError(" No links found in folder");
          return false;
        }

        if (onSuccess) {
          onSuccess();
        }

        await navigator.clipboard.writeText(textToCopy);
        showSuccess(message);
      return true;
    } catch (error) {
      return showError(error);
    }
  }, [showSuccess, showError]);
  // HANDLER 3 Add URL items as bookmarks
  const handleAddUrlsAsBookmarks = useCallback(async (
    folderIds: string[],
    options: {
      items: { title: string, url: string }[],
      onSuccess?: () => void
    }
  ): Promise<boolean> => {
    try {
      const { items, onSuccess } = options;
      
      for (const item of items) {
        console.log(`Creating bookmark: ${item.title || new URL(item.url).hostname} in folder ${folderIds[0]}`);
        await browser.bookmarks.create({
          parentId: folderIds[0],
          title: item.title || new URL(item.url).hostname,
          url: item.url
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      showSuccess("Links successfully bookmarked!");
      return true;
    } catch (error) {
      return showError(error);
    }
  }, [showSuccess, showError]);

  // HANDLER 4: Add browser tabs as bookmarks
  const handleAddTabsAsBookmarks = useCallback(async (
    folderIds: string[],
    options: {
      items: Tabs.Tab[],
      onSuccess?: () => void
    }
  ): Promise<boolean> => {
    try {
      const { items, onSuccess } = options;
      
      for (const tab of items) {
        if (tab.title && tab.url) {
          await browser.bookmarks.create({
            parentId: folderIds[0],
            title: tab.title,
            url: tab.url
          });
        }
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      showSuccess("Tabs successfully bookmarked!");
      return true;
    } catch (error) {
      return showError(error);
    }
  }, [showSuccess, showError]);

  const clearExportFormat = useCallback(() => {
    setExportFormat(undefined);
  }, []);

  return {
    // State
    bookmarkSuccess,
    showSuccess,
    showError,
    exportFormat,
    importedBookmarks,
    
    // State setters
    setExportFormat,
    setImportedBookmarks,
    clearExportFormat,
    
    // Handlers
    handlers: {
      handleBookmarkImport,
      handleBookmarkExport,
      handleAddUrlsAsBookmarks,
      handleAddTabsAsBookmarks
    }
  };
};