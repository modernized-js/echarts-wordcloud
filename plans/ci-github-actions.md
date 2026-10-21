# GitHub Actions CI (#4)

- Workflow `.github/workflows/ci.yml`, on `pull_request` and `push` to `master`.
- Single job on `ubuntu-26.04` (latest image; `ubuntu-latest` is still mid-migration from 24.04).
- Node `node`: the latest Current release, tracked without edits.
- Actions at their latest majors: `actions/checkout@v7`, `actions/setup-node@v7` with yarn cache.
- Steps: `yarn install --frozen-lockfile` → `yarn lint` → `yarn build`.
- `yarn test` is added once tests exist (out of scope here).
- `permissions: contents: read`, cancel superseded runs per ref, job timeout.
- Dependabot (`github-actions` ecosystem) keeps the action versions current.
