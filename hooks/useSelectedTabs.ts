import { useState, useEffect, useCallback } from 'react';
import { Tabs } from 'wxt/browser';

export const useSelectedTabs = () => {
  const [selectedTabs, setSelectedTabs] = useState<Tabs.Tab[]>([]);

  const checkForSelectedTabs = useCallback(() => {
    browser.tabs.query({ highlighted: true, currentWindow: true })
    .then((tabs) => {
      if (tabs.length > 0) {
        setSelectedTabs(tabs);
      } else {
        // If no tabs are highlighted, check if any tab is selected
        browser.tabs.query({ currentWindow: true })
        .then((allTabs) => {
          const selected = allTabs.filter(tab => tab.highlighted);
          setSelectedTabs(selected);
        });
      }
    });
  }, []);

  useEffect(() => {
    checkForSelectedTabs();
  }, [checkForSelectedTabs]);

  return { selectedTabs };
};