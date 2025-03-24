import React from 'react';
import Button from './Button';

// setUrlList, setShowUrlInput]
type BookmarkActionsProps = {
    setUrlList: (urlList: string) => void;
    setShowUrlInput: (show: boolean) => void;
};

const BookmarkSelActions: React.FC<BookmarkActionsProps> = ({ setUrlList, setShowUrlInput }) => {
    const startRectangularSelection = () => {
        // This function will be injected into the active tab
        console.log('[Rect Select] Starting rectangular selection tool');
        
        // Store extension ID for later use
        const extensionId = chrome.runtime.id;
        console.log('[Rect Select] Extension ID:', extensionId);
        
        const overlay = document.createElement('div');
        overlay.id = 'rect-select-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        overlay.style.zIndex = '9999';
        overlay.style.cursor = 'crosshair';
        
        const selectionRect = document.createElement('div');
        selectionRect.style.position = 'absolute';
        selectionRect.style.border = '2px dashed blue';
        selectionRect.style.backgroundColor = 'rgba(0, 123, 255, 0.2)';
        selectionRect.style.display = 'none';
        overlay.appendChild(selectionRect);
        
        document.body.appendChild(overlay);
        
        let startX: number, startY: number;
        let isSelecting = false;
        
        overlay.addEventListener('mousedown', (e) => {
          console.log('[Rect Select] Mouse down at', e.clientX, e.clientY);
          isSelecting = true;
          startX = e.clientX;
          startY = e.clientY;
          
          selectionRect.style.left = `${startX}px`;
          selectionRect.style.top = `${startY}px`;
          selectionRect.style.width = '0';
          selectionRect.style.height = '0';
          selectionRect.style.display = 'block';
        });
        
        overlay.addEventListener('mousemove', (e) => {
          if (!isSelecting) return;
          
          const currentX = e.clientX;
          const currentY = e.clientY;
          
          const width = currentX - startX;
          const height = currentY - startY;
          
          selectionRect.style.width = `${Math.abs(width)}px`;
          selectionRect.style.height = `${Math.abs(height)}px`;
          
          if (width < 0) {
            selectionRect.style.left = `${currentX}px`;
          }
          
          if (height < 0) {
            selectionRect.style.top = `${currentY}px`;
          }
        });
        
        overlay.addEventListener('mouseup', () => {
          console.log('[Rect Select] Mouse up, finishing selection');
          isSelecting = false;
          
          // Get the selection rectangle
          const rect = selectionRect.getBoundingClientRect();
          console.log('[Rect Select] Selection rect:', rect);
          
          // Find all links within the selection rectangle
          const links: string[] = [];
          const allLinks = document.querySelectorAll('a');
          console.log('[Rect Select] Total links on page:', allLinks.length);
          
          allLinks.forEach(link => {
            const linkRect = link.getBoundingClientRect();
            
            // Check if link intersects with selection rectangle
            const isIntersecting = !(
              linkRect.right < rect.left ||
              linkRect.left > rect.right ||
              linkRect.bottom < rect.top ||
              linkRect.top > rect.bottom
            );
            
            if (isIntersecting && link.href) {
              // Get the link's text content or use URL as fallback
              const linkText = link.textContent?.trim() || link.innerText?.trim() || new URL(link.href).pathname.split('/').pop() || 'Unnamed Link';
              
              // Format as "URL|LinkText"
              const formattedLink = `${link.href}|${linkText}`;
              
              links.push(formattedLink);
              console.log('[Rect Select] Found link:', formattedLink);
            }
          });
          
          console.log('[Rect Select] Total links found:', links.length);
          
          // Store the links in localStorage of the page first (fallback)
          localStorage.setItem('rect_selected_links', JSON.stringify(links));
          
          try {
            // Create a notification to indicate selection is complete
            const notificationDiv = document.createElement('div');
            notificationDiv.style.position = 'fixed';
            notificationDiv.style.bottom = '20px';
            notificationDiv.style.right = '20px';
            notificationDiv.style.backgroundColor = 'rgba(0, 123, 255, 0.9)';
            notificationDiv.style.color = 'white';
            notificationDiv.style.padding = '10px 15px';
            notificationDiv.style.borderRadius = '4px';
            notificationDiv.style.zIndex = '10000';
            notificationDiv.textContent = `${links.length} links selected. Click the extension icon to continue.`;
            document.body.appendChild(notificationDiv);
            
            setTimeout(() => {
              document.body.removeChild(notificationDiv);
            }, 5000);
            
            // Open a special communication channel to the extension
            // This avoids the "Receiving end does not exist" error
            window.postMessage({
              type: 'from_rect_select',
              links: links
            }, '*');
            
            console.log('[Rect Select] Posted message to window');
          } catch (error) {
            console.error('[Rect Select] Error in communication:', error);
          } finally {
            // Remove the overlay
            document.body.removeChild(overlay);
          }
        });
        
        // Add escape key handler to cancel selection
        document.addEventListener('keydown', function escHandler(e) {
          if (e.key === 'Escape') {
            console.log('[Rect Select] Selection canceled with Escape key');
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', escHandler);
          }
        });
        
        return "Selection tool activated";
      };
      
      const handleRectSelectClick = useCallback(() => {
        console.log('Activating rectangular selection tool');
        
        // Activate the rectangular selection tool in the current tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          console.log('Got active tab:', tabs[0]);
          const activeTab = tabs[0];
          if (activeTab?.id) {
            try {
              // First inject the message listener content script
              chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: () => {
                  // This injects the listener for window.postMessage events
                  window.addEventListener('message', function(event) {
                    if (event.data && event.data.type === 'from_rect_select') {
                      console.log('[Content Script] Received rect select data:', event.data);
                      localStorage.setItem('rect_selected_links', JSON.stringify(event.data.links));
                      chrome.storage.local.set({ selectedLinks: event.data.links }, () => {
                        console.log('[Content Script] Saved links to chrome.storage');
                      });
                    }
                  });
                  console.log('[Content Script] Message listener installed');
                }
              }).then(() => {
                console.log('Content script injected successfully');
                
                // Then execute the selection script in the page
                chrome.scripting.executeScript({
                  target: { tabId: activeTab.id as number },
                  func: startRectangularSelection
                }).then(results => {
                  console.log('Script injection results:', results);
                  // Close the popup after successful script injection
                  window.close();
                }).catch(err => {
                  console.error('Script injection error:', err);
                });
              });
            } catch (error) {
              console.error('Error in rect select setup:', error);
            }
          } else {
            console.error('No active tab ID found');
          }
        });
      }, []);
      
      // Effect to check for stored links when popup reopens
      useEffect(() => {
        console.log('App component mounted/updated - checking for stored links');
        
        // Check storage for any selected links
        chrome.storage.local.get(['selectedLinks'], (result) => {
          if (result.selectedLinks && Array.isArray(result.selectedLinks) && result.selectedLinks.length > 0) {
            console.log('Found stored links:', result.selectedLinks);
            setUrlList(result.selectedLinks.join('\n'));
            setShowUrlInput(true);
            
            // Clear storage after retrieving
            chrome.storage.local.remove(['selectedLinks'], () => {
              console.log('Cleared stored links from storage');
            });
          }
        });
      }, [setUrlList, setShowUrlInput]);

    const rectangleIcon = (<svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>)

    return (
    <div className="flex justify-center gap-2 mt-3">
        <Button
            onClick={handleRectSelectClick}
            variant="primary"
            fullWidth
            startIcon={rectangleIcon}
            >
            Bookmark a selection
        </Button>
    </div>
    );
};

export default React.memo(BookmarkSelActions);