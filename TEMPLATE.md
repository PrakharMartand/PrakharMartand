# readme.spec: set it up for your own profile

Your GitHub profile, as a test suite. You edit one file, `profile.json`, and a GitHub Action generates everything else, then refreshes your live GitHub stats every hour.

| Output | What it is |
|---|---|
| `README.md` | Profile README with a recruiter view and a developer view |
| `assets/*.svg` | Animated header, test run, tech stack and contribution history |
| `docs/` | Interactive site: runnable tests, terminal, bug hunt, printable résumé |
| `.github/ISSUE_TEMPLATE/` | "Hire me" and "bug report" issue forms |

All of these are generated. Don't edit them by hand, because the next run overwrites them.

## Setup (about 10 minutes)

### 1. Make your copy
Pick one:
- **Use this template** (green button on this repo, if it's shown), or
- **Fork** this repo, then open your fork's **Actions** tab and click **"I understand my workflows, go ahead and enable them"**. Forks start with Actions turned off.

Your repo **must be public and named exactly like your GitHub username** (`janedoe/janedoe`). That's how GitHub knows it's your profile README. Rename it in Settings → General if needed.

### 2. Edit `profile.json`
Open it on GitHub, click the pencil icon, and change:

| Field | What to put |
|---|---|
| `handle` | Your GitHub username |
| `name`, `title`, `tagline`, `summary` | You, in your own words |
| `links` | Your LinkedIn, website and email |
| `experience` | Your roles; mark the current one with `"current": true` |
| `stack` | Your tools, grouped. `icon` is a [Simple Icons](https://simpleicons.org) slug; for anything without a logo, use `mono` (two letters) and `hex` (colour) |
| `focus` | What you're exploring right now |
| `spec` | The tests shown in the animated run; see [Writing tests](#writing-tests) |
| `site` | Delete this line; it's worked out automatically |

Commit to `main`. The workflow starts on its own.

### 3. Turn on the site and issues
- **Settings → Pages**: source "Deploy from a branch", branch `main`, folder `/docs`. After a minute or two it's live at `https://<username>.github.io/<username>/`.
- **Settings → General → Features**: tick **Issues**, so the "hire me" and "bug report" buttons work.

### 4. Count private and company contributions (recommended)
The workflow's built-in token only sees your **public** activity. Without this step your contribution graph, streaks and totals miss private repo and company work.

1. Avatar → **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)**.
2. Set the note to `readme.spec`, pick an expiry, and tick only **`read:user`**. Generate it and copy the token.
3. If your company's GitHub organisation uses SSO, click **Configure SSO → Authorize** next to the token.
4. In your repo: **Settings → Secrets and variables → Actions → New repository secret**, named `README_SPEC_TOKEN`, with the token as the value.

The token can only read your profile data, and it's never written to the repo. If it expires, the workflow falls back to public-only numbers until you add a new one.

### 5. Run it
**Actions → readme.spec → Run workflow.** Open the run, expand **"Run the suite"**, and check the first line:

```
github: read as your personal token (README_SPEC_TOKEN) · 750 contributions
```

After that it re-runs every hour, and whenever you change `profile.json`.

## Writing tests

Each test in `spec` shows up as a line in the animated run and as a runnable test on the site:

```json
{ "title": "automates E2E with Playwright & Cypress", "ms": 640,
  "steps": ["await runner.use(['playwright','cypress'])", "expect(flakes).toBe(0)"] }
```

- **Live tests** add `"live": "<field>"` and can use `{contributions}`, `{longestStreak}`, `{currentStreak}`, `{repos}`, `{stars}`, `{pullRequests}` or `{followers}` in the title and steps.
- **Skipped tests** add `"skip": "reason"` and show up in amber.
- **Stack chips**: tools named in a test's title appear as chips on the site when that test runs.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Profile shows someone else's name or stats | The workflow hasn't run in your repo yet. Do step 5. |
| Log says "read as the Actions bot token" | The `README_SPEC_TOKEN` secret is missing, misnamed or expired, or the token isn't SSO-authorized for your org. |
| Log warns `handle ... doesn't match repo owner` | Set `handle` in `profile.json` to your username. The build already uses the right one, but fix it anyway. |
| Workflow fails on `git push` | Settings → Actions → General → Workflow permissions → **Read and write permissions**. |
| "Run me live" gives a 404 | Pages isn't turned on yet, or is still deploying. See step 3. |
| Profile README doesn't appear on your profile page | The repo must be public and named exactly like your username. |

## Build locally (optional)

```sh
node scripts/build.mjs            # no dependencies; Node 20+
DEMO=1 node scripts/build.mjs     # preview with sample GitHub data (don't commit that output)
```
