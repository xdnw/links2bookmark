import React, { useCallback } from 'react';
import Button from './Button';

type UrlInputProps = {
  urlList: string;
  setUrlList: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const UrlInput: React.FC<UrlInputProps> = ({ urlList, setUrlList, onCancel, onSubmit }) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUrlList(e.target.value);
  }, [setUrlList]);

  return (
    <div className='mb-2 mx-2'>
      <h2 className='text-xl text-orange-500 dark:text-orange-500 text-left font-extrabold border-b border-gray-200 dark:border-gray-700 mb-1'>Bookmark a list of URLs</h2>
      <p className="text-xs text-gray-600 dark:text-gray-200 mb-2 text-left">
        Enter one URL per line in any of these formats:<br />
        • https://example.com<br />
        • https://example.com | Example Site<br />
        • [Example Site](https://example.com)<br />
        URLs without titles will use the domain as the title.
      </p>
      <textarea
        className="w-full h-32 p-2 border border-gray-300 dark:border-gray-600 mb-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
        value={urlList}
        onChange={handleChange}
        placeholder="https://example.com | Title"
      />
      <div className="flex justify-between">
        <Button
          onClick={onCancel}
          variant="danger"
        >
          Cancel
        </Button>

        <Button
          onClick={onSubmit}
          variant="success"
          disabled={!urlList.trim()}
        >
          Add to Bookmarks
        </Button>
      </div>
    </div>
  );
};

export default React.memo(UrlInput);