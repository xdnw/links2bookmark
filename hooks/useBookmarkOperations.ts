import { ExportFormat } from '@/components/ExportDropdown';
import { useState, useCallback } from 'react';
import { toYoutubePlaylist } from './youtube';

// Helper function to recursively get all bookmarks from multiple folders
const getAllBookmarks = async (folderIds: string[]): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
  let allBookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];

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

export const useBookmarkOperations = () => {
  const [bookmarkSuccess, setBookmarkSuccess] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const [importedBookmarks, setImportedBookmarks] = useState<chrome.bookmarks.BookmarkTreeNode[] | null>(null);

  const handleFolderSelect = useCallback(async (
    folderIds: string[],
    exportFormat: ExportFormat | null,
    importedBookmarks: chrome.bookmarks.BookmarkTreeNode[] | null,
    parsedUrls: { title: string, url: string }[],
    selectedTabs: chrome.tabs.Tab[],
    onSuccess?: () => void
  ) => {
    try {
      if (importedBookmarks != null) {
        console.log("Importing bookmarks:", importedBookmarks);

        // Cache structure to avoid repeated API calls
        const folderCache = new Map<string, {
          bookmarkSet: Set<string>,  // "url|title" strings for quick lookup
          folderMap: Map<string, string>  // title -> id mapping
        }>();

        // Prefetch folder contents and build lookup structures
        const prefetchFolderContents = async (folderId: string) => {
          if (folderCache.has(folderId)) return;

          const children = await chrome.bookmarks.getChildren(folderId);
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
        };

        const createBookmarksRecursively = async (
          items: chrome.bookmarks.BookmarkTreeNode[],
          parentId?: string,
          skipDuplicateCheck: boolean = false
        ) => {
          // If we have a parent and need to check for duplicates, prefetch its contents
          if (parentId && !skipDuplicateCheck) {
            await prefetchFolderContents(parentId);
          }

          for (const item of items) {
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

              console.log(`Creating bookmark: ${item.title || new URL(item.url).hostname}`);
              await chrome.bookmarks.create({
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
                  console.log(`Creating folder: ${item.title || "Imported Folder"}`);
                  const newFolder = await chrome.bookmarks.create({
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
                  console.log(`Creating top folder: ${item.title || "Imported Folder"}`);
                  const newFolder = await chrome.bookmarks.create({
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
        };

        // Start the import process in the selected folder
        await createBookmarksRecursively(importedBookmarks, undefined);

        if (onSuccess) {
          onSuccess();
        }

        setBookmarkSuccess("Bookmarks successfully imported!");
        setTimeout(() => setBookmarkSuccess(null), 3000);
        return true;
      }
      if (exportFormat) {
        const items = await getAllBookmarks(folderIds);

        if (items.length === 0) {
          setBookmarkSuccess("Error: No links found in folder");
          setTimeout(() => setBookmarkSuccess(null), 3000);
          return false;
        }

        let message = (items.length === 1 ? "Link" : "Links") + " copied to clipboard!";
        let textToCopy = '';
        switch (exportFormat) {
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

        await navigator.clipboard.writeText(textToCopy);
        setBookmarkSuccess(message);
      } else {
        if (parsedUrls.length > 0) {
          // Add each parsed URL as a bookmark
          for (const item of parsedUrls) {
            await chrome.bookmarks.create({
              parentId: folderIds[0],
              title: item.title || new URL(item.url).hostname,
              url: item.url
            });
          }
        } else {
          // Add each tab as a bookmark
          for (const tab of selectedTabs) {
            if (tab.title && tab.url) {
              await chrome.bookmarks.create({
                parentId: folderIds[0],
                title: tab.title,
                url: tab.url
              });
            }
          }
        }

        if (onSuccess) {
          onSuccess();
        }

        setBookmarkSuccess("Tabs successfully bookmarked!");
      }
      setTimeout(() => setBookmarkSuccess(null), 3000);
      return true;
    } catch (error) {
      console.error("Error bookmarking:", error);
      setBookmarkSuccess(`Error: ${error}`);
      setTimeout(() => setBookmarkSuccess(null), 3000);
      return false;
    }
  }, []);

  const clearExportFormat = useCallback(() => {
    setExportFormat(null);
  }, []);

  return {
    bookmarkSuccess,
    setBookmarkSuccess,
    exportFormat,
    setExportFormat,
    clearExportFormat,
    handleFolderSelect,
    importedBookmarks,
    setImportedBookmarks
  };
};