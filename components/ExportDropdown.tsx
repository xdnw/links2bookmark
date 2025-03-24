import React, { useState, useCallback } from 'react';
import Button from './Button';

export type ExportFormat = 'urls' | 'tsv' | 'csv' | 'markdown' | 'youtube';

type ExportDropdownProps = {
  onSelectFormat: (format: ExportFormat) => void;
};

const ExportDropdown: React.FC<ExportDropdownProps> = ({ onSelectFormat }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev);
  }, []);

  const handleSelectFormat = useCallback((format: ExportFormat) => {
    onSelectFormat(format);
    setShowDropdown(false);
  }, [onSelectFormat]);

  const copyIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  );

  const arrowIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );

  return (
    <>
    <div className="flex justify-center gap-2 mt-3">
      <Button 
        onClick={toggleDropdown}
        variant="primary"
        fullWidth
        startIcon={copyIcon}
        endIcon={arrowIcon}
        className={`${showDropdown ? 'rounded-0 rounded-t' : 'rounded'} mb-2`}
      >
        Copy bookmarked folder to clipboard
      </Button>
    </div>
      {showDropdown && (
        <div className="w-full max-w-full bg-gray-50 dark:bg-black/25 border-2 border-gray-200 dark:border-gray-600 rounded-lg inset-shadow-sm">
          <ul className="py-1">
          <li>
            <Button
                onClick={() => handleSelectFormat('urls')}
                variant="ghost"
                fullWidth
                className="px-4 py-2 text-left justify-start"
            >
                Copy URLs only
            </Button>
            </li>
            <li>
            <Button
                onClick={() => handleSelectFormat('tsv')}
                variant="ghost"
                fullWidth
                className="px-4 py-2 text-left justify-start"
            >
                Copy as TSV
            </Button>
            </li>
            <li>
            <Button
                onClick={() => handleSelectFormat('csv')}
                variant="ghost"
                fullWidth
                className="px-4 py-2 text-left justify-start"
            >
                Copy as CSV
            </Button>
            </li>
            <li>
            <Button
                onClick={() => handleSelectFormat('markdown')}
                variant="ghost"
                fullWidth
                className="px-4 py-2 text-left justify-start"
            >
                Copy as Markdown
            </Button>
            <Button
                onClick={() => handleSelectFormat('youtube')}
                variant="ghost"
                fullWidth
                className="px-4 py-2 text-left justify-start"
            >
                Generate a YouTube playlist URL
            </Button>
            </li>
          </ul>
        </div>
      )}
    </>
  );
};

export default React.memo(ExportDropdown);