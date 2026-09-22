# readme.spec: use this profile as a template

Your profile, as a test suite. One file in, and everything else comes out:

| Output | What it is |
|---|---|
| `README.md` | GitHub profile with a recruiter view and a developer view |
| `assets/hero.svg` | Animated "locator picker" header |
| `assets/suite.svg` | Animated test run, with some assertions fed by live GitHub data |
| `assets/stack.svg` | Tech stack as a lockfile, with icons baked in (no third-party image services) |
| `assets/history.svg` | Contributions as CI pipeline history, plus streaks and language coverage |
| `docs/` | Interactive "UI mode" site: runnable tests, terminal, bug hunt, printable résumé |
| `.github/ISSUE_TEMPLATE/` | "Hire me" and "bug report" issue forms as contact channels |

## Make it yours

1. Fork this repo and rename it to your GitHub username (`you/you`), so it becomes your profile README.
2. Edit **`profile.json`**: name, experience, stack, links, and the `spec` tests. Tests with `"live"` use `{contributions}`, `{longestStreak}`, `{currentStreak}`, `{repos}`, `{stars}`, `{pullRequests}` or `{followers}`.
3. **Settings → Pages**: deploy from branch `main`, folder `/docs`. Then set `site` in `profile.json` to the Pages URL.
4. **Actions → readme.spec → Run workflow**. It fetches your GitHub data, rebuilds everything, and repeats nightly.

## Build locally

```sh
node scripts/build.mjs            # no dependencies; Node 20+
DEMO=1 node scripts/build.mjs     # preview with sample GitHub data (don't commit that output)
```

Icons come from [Simple Icons](https://simpleicons.org) (slug in `icon`). For anything without a logo, use `mono` for a two-letter badge and `hex` for its colour.
