import { useState, useCallback } from 'react';

export const useUrlParser = () => {
  const [urlList, setUrlList] = useState('');
  const [parsedUrls, setParsedUrls] = useState<{title: string, url: string}[]>([]);
  
  const parseUrls = useCallback(() => {
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
        const urlObject = new URL(url);
        
        // If no title is provided, use the domain as fallback
        if (!title) {
          title = urlObject.hostname;
        }
        
        return { url, title };
      });
      
      setParsedUrls(urls);
      return true;
    } catch (error) {
      console.error("Error parsing URLs:", error);
      return false;
    }
  }, [urlList]);

  const clearParsedUrls = useCallback(() => {
    setParsedUrls([]);
    setUrlList('');
  }, []);

  return {
    urlList,
    setUrlList,
    parsedUrls,
    parseUrls,
    clearParsedUrls
  };
};