# Rename to @modernized/echarts-wordcloud (#17)

- `name`: `@modernized/echarts-wordcloud`; `publishConfig.access: public`; `repository` / `homepage` / `bugs` → `modernized-js/echarts-wordcloud`; `keywords`; `packageManager: yarn@1.22.22` — as in the org's other packages.
- `author` and `license` (ISC) stay as upstream: the org preserves original authorship.
- No `engines.node`: this is a browser library, and yarn 1 fails installs on an `engines` mismatch, so it would only lock out consumers on older Node.
- File names (`dist/echarts-wordcloud(.min).js`) and the UMD global name stay, so `<script>` users only change the package path.
- README: title, CI / npm badges, drop-in replacement note, install commands and CDN path with the new name.
- The 3.0.0 version bump happens in the release step.
