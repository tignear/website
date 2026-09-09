import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { d2Diagrams } from './src/lib/markdown-d2.ts';

export default defineConfig({
  site: 'https://tignear.com',
  output: 'static',
  build: {
    format: 'directory',
  },
  markdown: {
    processor: satteri({ mdastPlugins: [d2Diagrams()] }),
    shikiConfig: {
      theme: 'github-dark-default',
    },
  },
});
