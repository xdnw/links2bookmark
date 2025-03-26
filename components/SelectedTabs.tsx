import React from 'react';
import Button from './Button';
import { Tabs } from 'wxt/browser';

type SelectedTabsProps = {
  selectedTabs: Tabs.Tab[];
  onBookmarkTabs: () => void;
};

const SelectedTabs: React.FC<SelectedTabsProps> = ({ selectedTabs, onBookmarkTabs }) => {
  const hasMultipleTabs = selectedTabs.length > 1;

  if (!hasMultipleTabs) {
    return (
      <p className="text-left text-gray-600 dark:text-gray-400">
        You can shift + select multiple tabs, then open this menu to bookmark them all at once.
      </p>
    );
  }

  const bookmarkIcon = (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>);

  return (
    <div>
      <p className="font-medium bg-emerald-400 dark:bg-emerald-700 text-emeral-700 dark:text-emerald-100  rounded-t px-2 w-fit mx-auto">
        {selectedTabs.length} tabs selected
      </p>
      <Button
        variant="primary"
        fullWidth
        startIcon={bookmarkIcon}
        onClick={onBookmarkTabs}
        className="mx-auto px-2 py-1 bg-blue-600/50 hover:bg-blue-700/50 active:bg-blue-800/50 dark:bg-blue-500/50 dark:hover:bg-blue-600/50 dark:active:bg-blue-700/50 text-gray-800 dark:text-white font-bold cursor-pointer transition-colors border border-transparent dark:border-slate-200 flex items-center gap-2"
      >
        Bookmark Selected Tabs
      </Button>
    </div>
  );
};

export default React.memo(SelectedTabs);