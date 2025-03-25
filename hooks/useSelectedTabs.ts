import { useState, useEffect, useCallback } from 'react';

export const useSelectedTabs = () => {
  const [selectedTabs, setSelectedTabs] = useState<chrome.tabs.Tab[]>([]);

  const checkForSelectedTabs = useCallback(() => {
    browser.tabs.query({ highlighted: true, currentWindow: true }, (tabs) => {
      setSelectedTabs(tabs);
    });
  }, []);

  useEffect(() => {
    checkForSelectedTabs();
  }, [checkForSelectedTabs]);

  return { selectedTabs };
};