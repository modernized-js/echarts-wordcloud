# Require echarts 6 (#21)

## Change

- `peerDependencies.echarts` `^6.1.0` (latest), devDependency echarts 6.1.0. Breaking for echarts 5 users → 4.0.0.
- Types: `echarts/types/dist/echarts` no longer resolves with echarts 6, and echarts 6 declares `RegisteredSeriesOption` separately for ESM (`types/dist/shared`) and CJS (`types/dist/echarts.d.cts`). `WordCloudSeriesOption` is now a top-level interface, registered by augmenting both `'echarts'` and `'echarts/types/dist/shared'`; it is exported from the package and still from `'echarts'`.
- README: version note, CDN echarts@6, changelog.

## Verification

- Seeded harness with echarts 6 (UMD via `<script>`, ESM via import map): layout events, preprocessed option and remove path identical to echarts 5. The rendered scene differs only in `style.fill` (`#5470c6` → `#5070dd`), echarts 6's new default palette.
- Dev-server examples (`wordCloud.html`, `test.html`) draw text with echarts 6, no console errors.
- Type matrix (consumer dirs with the generated declarations): `bundler` works with echarts 6 (series registered, wrong option rejected, `WordCloudSeriesOption` importable from the package and from `'echarts'`); `node16` ESM works except importing `WordCloudSeriesOption` from `'echarts'` (import it from the package).
- Known limitation: `node16` with a CommonJS consumer — echarts 6's `.d.cts` is an `export =` namespace that re-exports `RegisteredSeriesOption` by alias, so it cannot be augmented from outside and `type: 'wordCloud'` is not accepted there.
