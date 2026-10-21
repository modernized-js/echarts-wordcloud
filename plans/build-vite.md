# Replace webpack with Vite (#10)

## Change

- `vite.config.mjs` in library mode, replacing `webpack.config.js`; `webpack` / `webpack-cli` removed, `vite` added (latest).
- Output unchanged in shape: UMD `dist/echarts-wordcloud.js` (development, unminified) and `dist/echarts-wordcloud.min.js` (production, minified), both with source maps; `echarts/lib/echarts` stays external as global `echarts`.
- `emptyOutDir: false` because `release` runs two builds into the same `dist/`.
- Scripts keep their meaning: `dev` = watch build, `build` = development build, `release` = both.
- `dist/` is not rebuilt in this PR; it is regenerated at release time as before.

## Verification

- Built both Vite outputs and rendered them in headless Chrome with the seeded harness from the ESLint PR (seeds × mask × `shrinkToFit` × shape), capturing every `wordclouddrawn` event up to `wordcloudstop`.
- The event sequences matched the webpack build of the same source, for both the development and the minified output.

## License notice

- webpack extracted wordcloud2.js's MIT notice into `echarts-wordcloud.min.js.LICENSE.txt`. Vite's minified output dropped it by default, so `comments: { legal: true }` keeps the notice inline in `echarts-wordcloud.min.js` instead; the side file is no longer produced.
