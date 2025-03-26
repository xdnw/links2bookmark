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
    console.log(`Selected format: ${format}`);
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
        className=""
      >
        Copy bookmarked folder to clipboard
      </Button>
    </div>
      {showDropdown && (
        <div className="w-full max-w-full bg-gray-50 dark:bg-black/25">
          <ul>
          <li>
            <Button
                onClick={() => handleSelectFormat('urls')}
                variant="secondary"
                fullWidth
                rounded={false}
                className="px-4 py-2 text-left justify-start border-y-0 rounded-t-sm"
            >
                Copy URLs only
            </Button>
            </li>
            <li>
            <Button
                onClick={() => handleSelectFormat('tsv')}
                variant="secondary"
                fullWidth
                rounded={false}
                className="px-4 py-2 text-left justify-start border-y-0"
            >
                Copy as TSV
            </Button>
            </li>
            <li>
            <Button
                onClick={() => handleSelectFormat('csv')}
                variant="secondary"
                fullWidth
                rounded={false}
                className="px-4 py-2 text-left justify-start border-y-0"
            >
                Copy as CSV
            </Button>
            </li>
            <li>
            <Button
                onClick={() => handleSelectFormat('markdown')}
                variant="secondary"
                fullWidth
                rounded={false}
                className="px-4 py-2 text-left justify-start border-y-0"
            >
                Copy as Markdown
            </Button>
            <Button
                onClick={() => handleSelectFormat('youtube')}
                variant="secondary"
                fullWidth
                rounded={false}
                className="px-4 py-2 text-left justify-start border-t-0 rounded-b-sm"
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