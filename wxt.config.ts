import { defineConfig } from 'wxt';
import autoprefixer from 'autoprefixer'
import tailwindcss from '@tailwindcss/vite'

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  // Required
  modules: ['@wxt-dev/module-react'],

  manifest: {
    permissions: [
      'tabs',
      'bookmarks',
      "activeTab",
      "scripting",
      "tabs",
      "storage"
    ]
  },

  // Optional: Pass options to the module:
  vite: () => ({
    plugins: [
      tailwindcss(),
    ],
    css: {
      postcss: {
        plugins: [
          autoprefixer({}), // add options if needed
        ],
      }
    }
  }),
});
