# My Chrome Extension

This is a basic Chrome extension built with Vite, SWC, and TypeScript. It includes a background script, content script, popup interface, and options page.

## Project Structure

```
my-chrome-extension
├── public
│   └── manifest.json       # Metadata for the Chrome extension
├── src
│   ├── background.ts       # Background script
│   ├── content.ts          # Content script
│   ├── popup.ts            # Popup interface script
│   └── options.ts          # Options page script
├── vite.config.ts          # Vite configuration
├── package.json             # npm configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd my-chrome-extension
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   npm run build
   ```

4. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `public` directory.

## Usage

- The extension will run in the background and can interact with web pages through the content script.
- The popup interface can be accessed by clicking the extension icon in the Chrome toolbar.
- Users can configure settings through the options page.

## License

This project is licensed under the MIT License.