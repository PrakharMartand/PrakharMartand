import { readFile, writeFile } from "node:fs/promises";

const QUERY = `query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    pullRequests { totalCount }
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100, orderBy: {field: STARGAZERS, direction: DESC}) {
      totalCount
      nodes {
        stargazerCount
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name color } } }
      }
    }
    contributionsCollection {
      restrictedContributionsCount
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}`;

function streaks(days) {
  let longest = 0, run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // Today often has no contributions yet; don't let that break the current streak.
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  let current = 0;
  for (; i >= 0 && days[i].count > 0; i--) current++;
  return { longest, current };
}

function summarize(user) {
  const collection = user.contributionsCollection;
  const repos = user.repositories.nodes;
  const langs = new Map();
  for (const r of repos) {
    for (const { size, node } of r.languages.edges) {
      const prev = langs.get(node.name) ?? { name: node.name, color: node.color ?? "#8b949e", size: 0 };
      prev.size += size;
      langs.set(node.name, prev);
    }
  }
  const total = [...langs.values()].reduce((a, l) => a + l.size, 0) || 1;
  const languages = [...langs.values()]
    .sort((a, b) => b.size - a.size)
    .slice(0, 6)
    .map((l) => ({ name: l.name, color: l.color, pct: +((l.size / total) * 100).toFixed(1) }));

  const cal = collection.contributionCalendar;
  // Private contributions the token can't see are only available as a total, not per day.
  const hiddenPrivate = collection.restrictedContributionsCount;
  const weeks = cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
  const { longest, current } = streaks(weeks.flat());

  return {
    // Date only, so hourly runs with unchanged data produce no diff and no commit.
    fetchedAt: new Date().toISOString().slice(0, 10),
    contributions: cal.totalContributions + hiddenPrivate,
    hiddenPrivate,
    longestStreak: longest,
    currentStreak: current,
    repos: user.repositories.totalCount,
    stars: repos.reduce((a, r) => a + r.stargazerCount, 0),
    followers: user.followers.totalCount,
    pullRequests: user.pullRequests.totalCount,
    languages,
    weeks,
  };
}

async function query(login, token) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "readme-spec" },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  const body = await res.json();
  if (!res.ok || body.errors || !body.data?.user) throw new Error(JSON.stringify(body.errors ?? body).slice(0, 300));
  return summarize(body.data.user);
}

export async function loadGithub(login, cachePath) {
  const cached = await readFile(cachePath, "utf8").then(JSON.parse).catch(() => null);
  // A personal token reads the profile as its owner, which includes private and org contributions.
  // The Actions GITHUB_TOKEN is a bot identity that only sees public activity.
  const tokens = [
    ["your personal token (README_SPEC_TOKEN)", process.env.README_SPEC_TOKEN],
    ["the Actions bot token", process.env.GITHUB_TOKEN],
  ].filter(([, t]) => t);
  for (const [who, token] of tokens) {
    try {
      const data = await query(login, token);
      console.log(`github: read as ${who} · ${data.contributions} contributions`);
      if (data.hiddenPrivate > 0) {
        console.warn(`github: ${data.hiddenPrivate} private contributions are hidden from ${who}; the grid and streaks cover public activity only. Add a README_SPEC_TOKEN secret to include them.`);
      }
      await writeFile(cachePath, JSON.stringify(data, null, 2) + "\n");
      return data;
    } catch (err) {
      console.warn(`github: fetch as ${who} failed: ${err.message}`);
    }
  }
  if (tokens.length) console.warn("github: using cached data");
  return cached;
}
