import React, { useRef } from 'react';
import { Bookmarks } from 'wxt/browser';

interface ImportBookmarksProps {
    onImport: (bookmarks: Bookmarks.BookmarkTreeNode[]) => void;
}

function ImportBookmarks({ onImport }: ImportBookmarksProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            // remove all <DT> and <p> tags
            const cleanedText = text.replace(/<DT>|<\/DT>|<p>|<\/p>/g, '');
            const parser = new DOMParser();
            const doc = parser.parseFromString(cleanedText, 'text/html');

            // Parse bookmarks from HTML
            const bookmarks = parseBookmarksFromHtml(doc);
            console.log('Parsed bookmarks:', bookmarks);
            onImport(bookmarks);

            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error parsing bookmarks file:', error);
        }
    };

    const parseBookmarksFromHtml = (doc: Document): Bookmarks.BookmarkTreeNode[] => {
        let currentId = 0;

        const generateId = () => {
            currentId++;
            return `imported-${currentId}`;
        };

        console.log(`Document structure sample: ${doc.body.innerHTML.substring(0, 300)}...`);

        // Recursively process the bookmark structure
        const processStructure = (element: Element, parentId?: string, path?: string): Bookmarks.BookmarkTreeNode[] => {
            const results: Bookmarks.BookmarkTreeNode[] = [];

            // Process the current element
            if (element.tagName.toLowerCase() === 'dl') {
                // Find all direct children of the DL
                const children = Array.from(element.children);

                // Now look for H3 elements which indicate folders
                let folderName = null;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    // if h3 or dl, process
                    if (child.tagName.toLowerCase() === 'h3') {
                        folderName = child.textContent || 'Unnamed Folder';
                    } else if (child.tagName.toLowerCase() === 'dl') {
                        // Create a folder node
                        const folderId = generateId();
                        const folderNode: Bookmarks.BookmarkTreeNode = {
                            id: folderId,
                            title: folderName ?? 'Other Favorites',
                            parentId,
                            children: []
                        };

                        // Process this folder's contents
                        console.log(`Processing folder contents for: ${folderName ?? 'Other Favorites'}`);
                        const childItems = processStructure(child, folderId, path ? path + "/" + (folderName ?? 'Other Favorites') : (folderName ?? 'Other Favorites'));

                        // Add all child items to this folder
                        folderNode.children = childItems;

                        results.push(folderNode);

                        // if a tag
                    } else if (child.tagName.toLowerCase() === 'a') {
                        const bookmarkNode: Bookmarks.BookmarkTreeNode = {
                            id: generateId(),
                            title: child.textContent || 'Untitled Bookmark', // TODO FIXME use domain name
                            url: child.getAttribute('href') || '',
                            parentId
                        };

                        results.push(bookmarkNode);
                    }
                }
            }

            return results;
        };

        try {
            // Find the root DL element
            const rootDL = doc.querySelector('dl');

            if (rootDL) {
                console.log('Found root DL element');
                const rootId = generateId();
                const rootBookmarks = processStructure(rootDL);

                // First, extract the structure
                console.log(`Parsed ${rootBookmarks.length} root items`);

                // Add all parsed items to our result
                console.log(`Found ${rootBookmarks.length} bookmarks in this level: <root>`);

                // Dump the first few items for debugging
                console.log('Sample of parsed bookmarks:',
                    JSON.stringify(rootBookmarks.slice(0, 2), null, 2));


                const rootFolderNode: Bookmarks.BookmarkTreeNode = {
                    id: rootId,
                    title: 'Imported Bookmarks',
                    children: rootBookmarks
                };
                return [rootFolderNode];
            } else {
                console.error('No DL element found in the document');
                return [];
            }
        } catch (error) {
            console.error('Error parsing bookmarks:', error);
            return [];
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };
    const startIcon = useMemo(() => (
        <svg
            className="h-5 w-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
        </svg>
    ), []);

    return (
        <div className="mt-3">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".html,.htm"
                className="hidden"
            />
            <Button
                onClick={handleBrowseClick}
                variant="primary"
                fullWidth
                startIcon={startIcon}
            >
                Selectively Import Bookmarks File
            </Button>
        </div>
    );
}

export default ImportBookmarks;