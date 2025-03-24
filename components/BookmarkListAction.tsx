import React from 'react';
import Button from './Button';

type BookmarkActionsProps = {
    onToggleUrlInput: () => void;
};

const BookmarkListAction: React.FC<BookmarkActionsProps> = ({ onToggleUrlInput }) => {
    const listIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
    );

    return (
    <div className="flex justify-center gap-2 mt-3">
        <Button 
            onClick={onToggleUrlInput}
            variant="primary"
            fullWidth
            startIcon={listIcon}
            >
            Bookmark a list of URLs
        </Button>
    </div>
    );
};

export default React.memo(BookmarkListAction);