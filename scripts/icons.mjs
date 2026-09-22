import { readFile, writeFile } from "node:fs/promises";

const SOURCE = "https://raw.githubusercontent.com/simple-icons/simple-icons/develop";

async function fetchIcon(slug, meta) {
  const svg = await fetch(`${SOURCE}/icons/${slug}.svg`).then((r) => (r.ok ? r.text() : null));
  const path = svg?.match(/<path d="([^"]+)"/)?.[1];
  if (!path) return null;
  const entry = meta?.find((m) => (m.slug ?? slugify(m.title)) === slug);
  return { path, hex: entry ? `#${entry.hex}` : "#c9d1d9" };
}

function slugify(title) {
  return title.toLowerCase().replace(/\+/g, "plus").replace(/\./g, "dot").replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
}

export async function loadIcons(slugs, cachePath) {
  const cache = await readFile(cachePath, "utf8").then(JSON.parse).catch(() => ({}));
  const missing = slugs.filter((s) => !cache[s]);
  if (missing.length) {
    const meta = await fetch(`${SOURCE}/data/simple-icons.json`)
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? d : d.icons))
      .catch(() => null);
    for (const slug of missing) {
      const icon = await fetchIcon(slug, meta).catch(() => null);
      if (icon) cache[slug] = icon;
      else console.warn(`icon not found: ${slug}`);
    }
    await writeFile(cachePath, JSON.stringify(cache, null, 2) + "\n");
  }
  return cache;
}
