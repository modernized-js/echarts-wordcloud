# Publish ESM only with generated types, untrack dist/ (#12)

## Package

- `type: module`; `exports` → `./dist/echarts-wordcloud.js` (ESM) with `./dist/types/index.d.ts`; `main` / `module` / `types` for older tooling; `files: ["dist"]`.
- No `sideEffects` field: importing the package is what registers the series.
- Single unminified ESM bundle + source map; consumers minify. `echarts` and its subpaths stay external; wordcloud2.js's MIT notice is kept.
- `build` = `tsc -p .` → `vite build` → `tsc -p tsconfig.build.json` (declarations into `dist/types`); `prepublishOnly` runs it. `release` is gone (one output).
- `dist/` removed from git and ignored; `.npmignore` removed (`files` decides the tarball); hand-written `index.d.ts` removed.

## Types

- `src/option.ts` carries the former `index.d.ts` content, including the `echarts/types/dist/echarts` augmentation that registers `wordCloud` in `RegisteredSeriesOption`. `index.ts` re-exports `WordCloudTextStyle` / `WordCloudDataItem`.
- Only change: the `textStyle.color` callback parameter is `DefaultLabelFormatterCallbackParams` instead of `any`.
- Declarations that mention `echarts/lib/echarts` (internal) are emitted but not reachable from `index.d.ts`.

## Dev

- `yarn dev` = Vite dev server; examples import `echarts` and `../index.ts` as ES modules instead of loading the CDN echarts + UMD bundle.

## Verification

- Runtime: the seeded headless-Chrome harness loaded the ESM bundle through an import map (`echarts/lib/echarts` → echarts' ESM build) and compared against the UMD bundles from #13/#14: layout events, rendered text elements, highlight scene, preprocessed option and remove path all identical.
- Types: a consumer directory with the generated `dist/` — option with `type: 'wordCloud'` compiles with the import and fails without it; a wrong `gridSize` type fails; `WordCloudSeriesOption` is importable. The hand-written `index.d.ts` gives the same results. `example/typeTest.ts` fails on `right: null` / `bottom: null` under `strict` with both the old and new declarations.
- Dev server: `example/wordCloud.html` and `example/test.html` draw text (canvas pixels inspected over the DevTools protocol), no console errors. `example/optionKeywords.html` creates no canvas — the same as master's UMD version of that page, so it is not caused by this change.
