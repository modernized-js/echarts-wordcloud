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
