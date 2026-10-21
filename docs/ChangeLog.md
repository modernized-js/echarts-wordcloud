# ChangeLog

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
