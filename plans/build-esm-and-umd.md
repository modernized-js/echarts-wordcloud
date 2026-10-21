# Publish UMD alongside ESM (#16)

## Why

The modernized-js org promises drop-in replacements with ESM and CJS. ESM-only (#12) broke `<script>` / CDN users of `dist/echarts-wordcloud(.min).js` and `require()` users.

## Change

- Three Vite builds selected by `--mode`: `esm` → `dist/echarts-wordcloud.mjs`, `umd` → `dist/echarts-wordcloud.js`, `umd-min` → `dist/echarts-wordcloud.min.js` (the UMD paths match 2.x). An unknown mode fails the build.
- `exports`: `types`, `import` → ESM, `require` / `default` → UMD, `./dist/*` for direct file access; `main` → UMD, `module` → ESM.
- No `"type": "module"`: with it, Node would load the UMD `.js` as ESM and `require()` would break.
- README: the `<script>` install path is back.

## Verification

- Seeded harness: UMD (unminified and minified) via `<script>`, ESM via an import map — layout events, rendered scene, highlight scene, preprocessed option and remove path identical to the previous TS/JS bundles.
- Resolution: `require('echarts-wordcloud')` → UMD, `import` → ESM, `echarts-wordcloud/dist/echarts-wordcloud.min.js` resolves.
- Types (`moduleResolution: bundler`): same results as before. Under `node16`, `import * as echarts from 'echarts'` itself fails (TS2497) whether or not this package is imported.
