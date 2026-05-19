import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mentivue.sk',
  integrations: [
    sitemap({
      // Internal pages excluded from the public sitemap.
      filter: (page) => !page.includes('/og-card'),
    }),
  ],
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
  server: {
    port: 4321,
  },
});
