import { browser } from 'wxt/browser';
interface Message {
  type: string;
  links?: string[];
}

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });
 
  console.log('Background script loaded');
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const typedMessage = message as Message; // Explicitly cast message to Message
    if (typedMessage.type === 'from_rect_select' && typedMessage.links) {
      console.log('Background script received links:', typedMessage.links);
      browser.storage.local.set({ selectedLinks: typedMessage.links });
      sendResponse({ success: true });
    }
    return true; // Indicates async response
  });
});
