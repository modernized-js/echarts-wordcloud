# Migrate src to TypeScript (#11)

## Scope

- All of `src/` (including `layout.ts`, vendored from wordcloud2.js) and the entry are TypeScript, `strict`, no `any`, no `as`.
- TypeScript 6.0.3: the latest release (7.x, native) is not supported by typescript-eslint yet, which needs `<6.1`.
- `typecheck` script; `build` / `release` run `tsc` first, so CI's existing `yarn build` step checks types.
- ESLint: `typescript-eslint` `recommendedTypeChecked` on `*.ts`.
- Output is still UMD here; the public `index.d.ts` is unchanged (replaced by generated types in #12).

## How the code was converted

- Logic is transcribed line by line; structure is kept. Splitting the long wordcloud2 functions is out of scope: behaviour-preserving decomposition of that code cannot be shown with the current instrument, so it is left as is.
- Options merge: `{ ...defaults, ...options }` replaces the `for (key in options) if (key in settings)` loop. Both copy keys whose value is `undefined` (e.g. `layoutAnimation`), which is what disables layout animation today.
- Polymorphic settings (`weightFactor`, `shape`, `color`, `fontWeight`, `classes`) are normalised into separate functions instead of overwriting `settings`.
- `seriesModel.layoutInstance` / `view._model` expandos became `WeakMap`s.
- `echarts/lib/echarts` has no declarations; `src/echarts-lib.d.ts` maps its types to `echarts/core`. The runtime import is unchanged because that entry also registers the canvas renderer.
- `textEl.__highDownDispatcher = true` is removed: `enableHoverEmphasis` sets the same flag just before.
- `textEl.setStyle(obj)` became `Object.assign(textEl.style, obj)` + `dirtyStyle()`, which is what `setStyle` does; zrender types text `fill` as string, but the visual can be a gradient.
- String model paths (`'textStyle.fontSize'`) became array paths; `Model.get` splits strings on `.`, so they are the same lookup. `ecModel.get(['textStyle', x])` became `ecModel.get('textStyle')?.x`; GlobalModel has no parent model, so there is no fallback to lose.

## Deliberate differences (failure paths only)

- `getContext('2d')` returning `null` throws a named `Error` instead of a later `TypeError`.
- A missing layout instance / rendered model throws a named `Error` instead of a `TypeError`.
- A `textStyle.fontSize` with a unit suffix (`'20px'`) becomes `NaN` via `Number()`; it already produced a `NaN` layout before.

## Verification

- Seeded headless-Chrome harness (seeds × mask × `shrinkToFit` × shape), JS (Vite) bundle vs TS bundle, development and minified:
  - `wordclouddrawn` event sequence up to `wordcloudstop`: identical.
  - Rendered text elements (position, rotation, scale, full style incl. a gradient fill, emphasis/blur state styles, high-down flag, state transition), the scene after a `highlight` action, the preprocessed legacy `textStyle.normal/emphasis` option, and the scene after removing the series: identical.
  - `style.x` / `style.y` are compared with a 0.1px tolerance: they come from `measureText` on tiny fonts and vary between two runs of the same bundle.
- Sensitivity: changing the text y-offset in the view made every case differ.
- Not exercised: the DIV drawing path, `hover`/`click`/`drawMask`/`classes` options (unreachable from this package), and the emphasis state actually becoming active (the `highlight` action left `currentStates` empty in the harness).
