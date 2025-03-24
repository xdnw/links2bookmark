import { useState, useCallback } from 'react';

export const useBookmarkOperations = () => {
  const [bookmarkSuccess, setBookmarkSuccess] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'urls' | 'tsv' | 'csv' | 'markdown' | null>(null);

  const handleFolderSelect = useCallback(async (
    folderId: string, 
    exportFormat: 'urls' | 'tsv' | 'csv' | 'markdown' | null,
    parsedUrls: {title: string, url: string}[],
    selectedTabs: chrome.tabs.Tab[],
    onSuccess?: () => void
  ) => {
    try {
      if (exportFormat) {
        const items = await chrome.bookmarks.getChildren(folderId);
        
        if (items.length === 0) {
          setBookmarkSuccess("Error: No links found in folder");
          setTimeout(() => setBookmarkSuccess(null), 3000);
          return false;
        }
        
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
        }
        
        await navigator.clipboard.writeText(textToCopy);
        setBookmarkSuccess("Links copied to clipboard!");
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