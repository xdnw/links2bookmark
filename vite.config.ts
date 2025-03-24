import { defineConfig } from 'vite';
import { chrome } from 'vite-plugin-chrome-extension';

export default defineConfig({
  plugins: [chrome()],
  build: {
    rollupOptions: {
      input: {
        background: 'src/background.ts',
        content: 'src/content.ts',
        popup: 'src/popup.ts',
        options: 'src/options.ts',
      },
    },
  },
});