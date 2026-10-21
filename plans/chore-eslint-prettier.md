# Set up ESLint and Prettier (#3)

## Tooling

- ESLint 10 flat config (`eslint.config.mjs`) with `@eslint/js` recommended + `eslint-config-prettier`.
- Prettier 3; keep the existing `.prettierrc`. Prettier runs as its own check, not through an ESLint plugin.
- Remove `.eslintrc.js` / `.eslintrc.yaml` (eslint was never installed; the `.yaml` held JS).
- Scripts: `lint` = `eslint . && prettier --check .`, `format` = `prettier --write . && eslint --fix .`.
- Lint scope: `index.js`, `src/`, `webpack.config.js`. `dist/` and `example/` are ignored.

## Commits

1. Tooling only.
2. `prettier --write` reformat — verified by comparing ASTs before/after (formatting must not change the AST).
3. Fixes for the existing ESLint findings, each spec-equivalent:
   - `no-redeclare`: drop the second `var` on already-declared function-scoped vars.
   - `no-prototype-builtins`: `Object.prototype.hasOwnProperty.call` (not `Object.hasOwn`, because `dist/` is not transpiled).
   - `no-unused-vars`: drop trailing unused params of echarts callbacks.
   - `no-useless-assignment` (`transformRule`): initialise with the first value.
   - `no-useless-assignment` (memory release in `layout.js`): scope the vars to the block with `const` so nothing keeps them alive, then drop the manual release.
   - Remove the inline `no-labels` comments; the rule is not enabled.

## Verification of commit 3

- Built the bundle before and after the fixes and rendered both in headless Chrome with a seeded `Math.random`, across seeds × mask on/off × `shrinkToFit` × shape.
- Captured every `wordclouddrawn` event (word, grid position, rotation) until `wordcloudstop`, and compared the sequences: identical.
- Sensitivity check: deliberately breaking the mask threshold in `updateCanvasMask` and the `bgPixel` comparison in `layout.js` both produced layout differences in every mask case.
- Not exercised: the DIV drawing path (`transformRule`) — `wordCloud.js` always passes a canvas, so it is unreachable from this package.
- Raw canvas hashes were not used as the oracle: they differ between two runs of the same bundle.
