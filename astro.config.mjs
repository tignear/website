import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tignear.com',
  output: 'static',
  build: {
    format: 'directory',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
    },
  },
});
