import { useState, useEffect } from 'react';
import './app.css';
import BookmarkTree from '../../components/BookmarkTree';

function App() {
  const [count, setCount] = useState(0);
  const [selectedTabs, setSelectedTabs] = useState<chrome.tabs.Tab[]>([]);
  const [bookmarkSuccess, setBookmarkSuccess] = useState<string | null>(null);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlList, setUrlList] = useState('');
  const [parsedUrls, setParsedUrls] = useState<{title: string, url: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [exportFormat, setExportFormat] = useState<'urls' | 'tsv' | 'csv' | 'markdown' | null>(null);
  

  useEffect(() => {
    // Check for selected tabs when component mounts
    checkForSelectedTabs();
    
    // Chrome API doesn't have a direct event for tab selection changes in the UI
    // We'll update on popup open instead
  }, []);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const copyLinks = (format: 'urls' | 'tsv' | 'csv' | 'markdown') => {
    setExportFormat(format);
    setShowDropdown(false);
    setShowFolderSelector(true);
  };
  
  const checkForSelectedTabs = () => {
    chrome.tabs.query({ highlighted: true, currentWindow: true }, (tabs) => {
      setSelectedTabs(tabs);
    });
  };
  
  const bookmarkSelectedTabs = () => {
    // Show the folder selector
    setShowFolderSelector(true);
  };
  
  const handleFolderSelect = async (folderId: string) => {
    try {
      if (exportFormat) {
        let textToCopy = '';
        const items = await chrome.bookmarks.getChildren(folderId);
        
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
        if (items.length === 0) {
          setExportFormat(null);
          setShowFolderSelector(false);
          setBookmarkSuccess("Error: No links found in folder");
          setTimeout(() => setBookmarkSuccess(null), 3000);
          return;
        }
        
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            setBookmarkSuccess("Links copied to clipboard!");
          })
          .catch(err => {
            console.error("Copy failed:", err);
            setBookmarkSuccess("Error copying links:" + err);
          }).finally(() => {
            setExportFormat(null);
            setShowFolderSelector(false);
            setTimeout(() => setBookmarkSuccess(null), 3000);
          });
      } else {
        if (parsedUrls.length > 0) {
          // Add each parsed URL as a bookmark in the selected folder
          for (const item of parsedUrls) {
            await chrome.bookmarks.create({
              parentId: folderId,
              title: item.title || new URL(item.url).hostname,
              url: item.url
            });
          }
        } else {
          // Add each tab as a bookmark in the selected folder
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
        
        setShowFolderSelector(false);
        setShowUrlInput(false);
        setParsedUrls([]);
        setUrlList('');
        setBookmarkSuccess("Tabs successfully bookmarked!");
        setTimeout(() => setBookmarkSuccess(null), 3000); // Clear message after 3 seconds
      }
    } catch (error) {
      console.error("Error bookmarking:", error);
      setBookmarkSuccess("Error bookmarking:" + error);
      setTimeout(() => setBookmarkSuccess(null), 3000);
    }
  };
  
  const handleCancelSelection = () => {
    setShowFolderSelector(false);
    if (parsedUrls.length > 0) {
      setShowUrlInput(true);
    }
  };

  const toggleUrlInput = () => {
    setShowUrlInput(!showUrlInput);
  };

  const parseUrls = () => {
    try {
      const lines = urlList.split('\n').filter(line => line.trim());
      const urls = lines.map(line => {
        let url = '';
        let title = '';
        
        // Check if it's a markdown link: [Title](URL)
        const markdownMatch = line.match(/\[(.*?)\]\((.*?)\)/);
        if (markdownMatch) {
          title = markdownMatch[1].trim();
          url = markdownMatch[2].trim();
        } else {
          // Check if it's URL | Title format
          const parts = line.split('|');
          url = parts[0].trim();
          title = parts.length > 1 ? parts[1].trim() : '';
        }
        
        // Basic URL validation
        const urlObject = new URL(url); // Will throw if invalid
        
        // If no title is provided, use the domain as fallback
        if (!title) {
          title = urlObject.hostname;
        }
        
        return { url, title };
      });
      
      setParsedUrls(urls);
      setShowFolderSelector(true);
    } catch (error) {
      console.error("Error parsing URLs:", error);
      setBookmarkSuccess("Error parsing URLs:" + error);
      setTimeout(() => setBookmarkSuccess(null), 3000);
    }
  };

  if (showFolderSelector) {
    return (
      <BookmarkTree
        mode="select"
        onSelectFolder={handleFolderSelect}
        onCancel={handleCancelSelection}
      />
    );
  }

  if (showUrlInput) {
    return (
      <>
        <h2 className='text-lg text-gray-800 dark:text-white'>Add URLs to Bookmarks</h2>
        <div className="p-2">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          Enter one URL per line in any of these formats:<br/>
          • https://example.com<br/>
          • https://example.com | Example Site<br/>
          • [Example Site](https://example.com)<br/>
          URLs without titles will use the domain as the title.
        </p>
          <textarea 
            className="w-full h-32 p-2 border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" 
            value={urlList}
            onChange={(e) => setUrlList(e.target.value)}
            placeholder="https://example.com | Title"
          />
          <div className="flex justify-between">
            <button
              onClick={() => setShowUrlInput(false)}
              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-500 dark:hover:bg-gray-600 dark:active:bg-gray-700 text-gray-800 dark:text-white rounded font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={parseUrls}
              className="px-2 py-1 bg-blue-600/50 hover:bg-blue-700/50 active:bg-blue-800/50 dark:bg-blue-500/50 dark:hover:bg-blue-600/50 dark:active:bg-blue-700/50 text-gray-800 dark:text-white rounded font-bold transition-colors"
              disabled={!urlList.trim()}
            >
              Add to Bookmarks
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="mb-2">
      {bookmarkSuccess && (
          <p className={`my-2 font-medium border rounded px-2 w-fit mx-auto ${bookmarkSuccess.startsWith("Error") ? "border-red-500 text-red-600 dark:text-red-500" : "border-emerald-500 text-emerald-600 dark:text-emerald-500"}`}>{bookmarkSuccess}</p>
      )}
      <h2 className='text-lg text-gray-800 dark:text-white'>Links to Bookmarks</h2>

      {selectedTabs.length > 1 ? (
        <div>
        <p className="font-medium bg-emerald-600 dark:bg-emerald-700 text-gray-800 dark:text-white rounded-t px-2 w-fit mx-auto">
        {selectedTabs.length} tabs selected
      </p>
        <button 
          onClick={bookmarkSelectedTabs}
          className="mx-auto px-2 py-1 bg-blue-600/50 hover:bg-blue-700/50 active:bg-blue-800/50 dark:bg-blue-500/50 dark:hover:bg-blue-600/50 dark:active:bg-blue-700/50 text-gray-800 dark:text-white rounded font-bold cursor-pointer transition-colors border border-transparent dark:border-slate-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          Bookmark Selected Tabs
        </button>
      </div>
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-400">You can shift + select multiple tabs to bookmark them</p>
      )}
      <div className="flex justify-center gap-2 mt-3">
        <button 
          onClick={toggleUrlInput}
          className="px-2 py-1 bg-blue-600/50 hover:bg-blue-700/50 active:bg-blue-800/50 dark:bg-blue-500/50 dark:hover:bg-blue-600/50 dark:active:bg-blue-700/50 text-gray-800 dark:text-white rounded font-bold cursor-pointer transition-colors border border-transparent dark:border-slate-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          Add URLs from a list
        </button>
      </div>
      <div className="flex flex-col items-center gap-2 mt-3">
        <button 
          onClick={toggleDropdown}
          className="px-2 py-1 bg-blue-600/50 hover:bg-blue-700/50 active:bg-blue-800/50 dark:bg-blue-500/50 dark:hover:bg-blue-600/50 dark:active:bg-blue-700/50 text-gray-800 dark:text-white rounded font-bold cursor-pointer transition-colors border border-transparent dark:border-slate-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy links
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        
        {showDropdown && (
          <div className="w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg mb-2">
            <ul className="py-1">
              <li>
                <button
                  onClick={() => copyLinks('urls')}
                  className="px-4 py-2 text-left w-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white"
                >
                  Copy URLs only
                </button>
              </li>
              <li>
                <button
                  onClick={() => copyLinks('tsv')}
                  className="px-4 py-2 text-left w-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white"
                >
                  Copy as TSV
                </button>
              </li>
              <li>
                <button
                  onClick={() => copyLinks('csv')}
                  className="px-4 py-2 text-left w-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white"
                >
                  Copy as CSV
                </button>
              </li>
              <li>
                <button
                  onClick={() => copyLinks('markdown')}
                  className="px-4 py-2 text-left w-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white"
                >
                  Copy as Markdown
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;