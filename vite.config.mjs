import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: 'index.ts',
      formats: ['es'],
      fileName: () => 'echarts-wordcloud.js'
    },
    minify: false,
    sourcemap: true,
    rolldownOptions: {
      external: [/^echarts(\/|$)/],
      output: {
        // Keeps wordcloud2.js's MIT notice in the bundle.
        comments: { legal: true }
      }
    }
  }
});
