# Enable Dependabot (#2)

- Add `.github/dependabot.yml`.
- Ecosystems: `npm` (Dependabot reads `yarn.lock` through this ecosystem) and `github-actions`.
- Schedule: weekly.
- Group minor/patch updates per ecosystem to keep PR noise low; majors stay as individual PRs.
- No auto-merge.
