import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  return {
    publicDir: false,
    build: {
      lib: {
        entry: 'index.ts',
        formats: ['umd'],
        name: 'echarts-wordcloud',
        fileName: () =>
          isProduction ? 'echarts-wordcloud.min.js' : 'echarts-wordcloud.js'
      },
      // `release` runs two builds into dist/; keep the other one's output.
      emptyOutDir: false,
      minify: isProduction,
      sourcemap: true,
      rolldownOptions: {
        external: ['echarts/lib/echarts'],
        output: {
          globals: { 'echarts/lib/echarts': 'echarts' },
          // Keeps wordcloud2.js's MIT notice in the minified bundle.
          comments: { legal: true }
        }
      }
    }
  };
});
