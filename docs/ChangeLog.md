# ChangeLog

## @modernized/echarts-wordcloud@4.0.1 — 2026-10-21

- #25 Fix #24: `dispose()` now stops a running layout. The `wordcloudstart` and `wordclouddrawn` events the layout loop checks for cancellation were created without `cancelable: true`, so `preventDefault()` had no effect and the loop kept placing words on a detached canvas; a resize mid-layout also let the old layout run to the end. Event dispatch moved into `src/events.ts` with `node:test` coverage, and CI runs `yarn test`.
- #23 Record 4.0.0 in the changelog.

npm: [`@modernized/echarts-wordcloud@4.0.1`](https://www.npmjs.com/package/@modernized/echarts-wordcloud/v/4.0.1)

## @modernized/echarts-wordcloud@4.0.0 — 2026-10-21

- #22 **Breaking**: require Apache ECharts 6 (`peerDependencies.echarts: ^6.1.0`); stay on 3.x for ECharts 5. Register the `wordCloud` series type for ECharts 6's separate ESM (`types/dist/shared`) and CJS declarations, export `WordCloudSeriesOption` from the package, README version note and CDN example. Known limitation: CommonJS TypeScript projects with `moduleResolution: node16` cannot get the series type (ECharts 6's `.d.cts` is an `export =` namespace). Runtime behaviour matches ECharts 5 apart from ECharts 6's default palette.
- #20 Add `docs/ChangeLog.md` with the 3.0.0 entry.

npm: [`@modernized/echarts-wordcloud@4.0.0`](https://www.npmjs.com/package/@modernized/echarts-wordcloud/v/4.0.0)

## @modernized/echarts-wordcloud@3.0.0 — 2026-10-21

First release of the maintained fork of [`echarts-wordcloud`](https://github.com/ecomfe/echarts-wordcloud) (upstream 2.1.0) under the `@modernized` scope. Drop-in replacement: change the package name from `echarts-wordcloud` to `@modernized/echarts-wordcloud`.

- #19 Rename the package to `@modernized/echarts-wordcloud`; org metadata (`repository`, `homepage`, `bugs`, `publishConfig`), README with drop-in note and new install paths.
- #18 Publish UMD alongside ESM, selected through `exports` (`import` → ESM, `require` / `default` → UMD, `./dist/*` for direct paths); drop `"type": "module"` so Node loads the UMD file as CommonJS.
- #15 Generate declarations from source (replacing the hand-written `index.d.ts`); the `textStyle.color` callback parameter is `DefaultLabelFormatterCallbackParams` instead of `any`. Stop tracking `dist/` in git; `files` / `exports` / `prepublishOnly`; examples as ES modules on the Vite dev server.
- #14 Migrate `src/` to strict TypeScript 6 (7.x is not yet supported by typescript-eslint); `typecheck` script, `build` type-checks first, typescript-eslint `recommendedTypeChecked`. Expando properties on echarts models became `WeakMap`s; failure paths throw named errors. Layout output and rendered elements verified identical to the JavaScript build.
- #13 Replace webpack with Vite (library mode); keep the minified bundle's license notice.
- #9 GitHub Actions CI (install, lint, build) on Ubuntu 26.04 with the latest Node.
- #6 ESLint 10 flat config and Prettier 3 with `lint` / `format` scripts; existing lint findings fixed without behaviour change.
- #5 Dependabot for npm and GitHub Actions.
- #1 Switch from npm to yarn.

npm: [`@modernized/echarts-wordcloud@3.0.0`](https://www.npmjs.com/package/@modernized/echarts-wordcloud/v/3.0.0)
