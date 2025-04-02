export default defineContentScript({
  matches: ['*://*/*'], // Need to listen to all pages to capture the rectangle selection
  main() {
    // Add this to your content script file
    window.addEventListener('message', (event) => {
      // Make sure the message is from our page script
      if (event.source === window && 
          event.data.source === 'rectangle_selection' &&
          event.data.type === 'from_rect_select') {
        
        // Forward the message to the extension background
        browser.runtime.sendMessage({
          type: 'from_rect_select',
          links: event.data.links
        });
      }
    });
  },
});
