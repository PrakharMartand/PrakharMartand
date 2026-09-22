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

  const cal = user.contributionsCollection.contributionCalendar;
  const weeks = cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
  const { longest, current } = streaks(weeks.flat());

  return {
    fetchedAt: new Date().toISOString(),
    contributions: cal.totalContributions,
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

export async function loadGithub(login, cachePath) {
  const cached = await readFile(cachePath, "utf8").then(JSON.parse).catch(() => null);
  const token = process.env.GITHUB_TOKEN;
  if (!token) return cached;
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "readme-spec" },
      body: JSON.stringify({ query: QUERY, variables: { login } }),
    });
    const body = await res.json();
    if (!res.ok || body.errors || !body.data?.user) throw new Error(JSON.stringify(body.errors ?? body).slice(0, 300));
    const data = summarize(body.data.user);
    await writeFile(cachePath, JSON.stringify(data, null, 2) + "\n");
    return data;
  } catch (err) {
    console.warn(`github fetch failed, using cached data: ${err.message}`);
    return cached;
  }
}
