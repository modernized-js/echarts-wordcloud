import { defineConfig } from 'vite';

const outputs = {
  esm: { format: 'es', fileName: 'echarts-wordcloud.mjs', minify: false },
  umd: { format: 'umd', fileName: 'echarts-wordcloud.js', minify: false },
  'umd-min': {
    format: 'umd',
    fileName: 'echarts-wordcloud.min.js',
    minify: true
  }
};

export default defineConfig(({ command, mode }) => {
  const output = outputs[mode];
  if (command === 'build' && !output) {
    throw new Error(
      `Unknown build mode "${mode}"; use one of: ${Object.keys(outputs).join(', ')}`
    );
  }
  return {
    publicDir: false,
    build: output && {
      lib: {
        entry: 'index.ts',
        formats: [output.format],
        name: 'echarts-wordcloud',
        fileName: () => output.fileName
      },
      // Only the first build clears dist/; the others add their file to it.
      emptyOutDir: mode === 'esm',
      minify: output.minify,
      sourcemap: true,
      rolldownOptions: {
        external: [/^echarts(\/|$)/],
        output: {
          globals: { 'echarts/lib/echarts': 'echarts' },
          // Keeps wordcloud2.js's MIT notice in the bundles.
          comments: { legal: true }
        }
      }
    }
  };
});
