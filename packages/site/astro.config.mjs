import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mentivue.sk',
  integrations: [
    tailwind(),
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
