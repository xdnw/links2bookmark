import { ExportFormat } from '@/components/ExportDropdown';
import { useState, useCallback } from 'react';
import { toYoutubePlaylist } from './youtube';

// Helper function to recursively get all bookmarks
const getAllBookmarks = async (folderId: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
  const children = await browser.bookmarks.getChildren(folderId);
  if (!children) return [];
  let allBookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];

  for (const child of children) {
    if (child.url) {
      // This is a bookmark, add it to the list
      allBookmarks.push(child);
    } else {
      // This is a folder, recursively get its bookmarks
      const nestedBookmarks = await getAllBookmarks(child.id);
      allBookmarks = allBookmarks.concat(nestedBookmarks);
    }
  }

  return allBookmarks;
};

export const useBookmarkOperations = () => {
  const [bookmarkSuccess, setBookmarkSuccess] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);

  const handleFolderSelect = useCallback(async (
    folderId: string,
    exportFormat: ExportFormat | null,
    parsedUrls: { title: string, url: string }[],
    selectedTabs: chrome.tabs.Tab[],
    onSuccess?: () => void
  ) => {
    try {
      if (exportFormat) {
        const items = await getAllBookmarks(folderId);

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
              parentId: folderId,
              title: item.title || new URL(item.url).hostname,
              url: item.url
            });
          }
        } else {
          // Add each tab as a bookmark
          for (const tab of selectedTabs) {
            if (tab.title && tab.url) {
              await chrome.bookmarks.create({
                parentId: folderId,
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
    handleFolderSelect
  };
};