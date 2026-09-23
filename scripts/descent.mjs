// "Descent": one continuous living scene, scrolled from dusk sky to deep sea.
// Dusk: a murmuration spells the name. Night: a star atlas of the craft and the year.
// Surface: tonight's moon. Abyss: repositories as bioluminescent creatures above a seabed of contributions.

const SERIF = "Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const W = 1000, H = 2000, HORIZON = 1180;

const GLYPHS = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"], B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"], D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"], F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."], H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"], J: ["..###", "...#.", "...#.", "...#.", "#..#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"], L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"], N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."], P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"], R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."], T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."], V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"], X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."], Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
};

const f = (n) => +n.toFixed(1);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function mix(c1, c2, t) {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [a, b] = [p(c1), p(c2)];
  return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

// 0 = new moon, 0.5 = full. Reference new moon: 2000-01-06 18:14 UTC.
function moonPhase(date) {
  const synodic = 29.530588853;
  const days = (date - Date.UTC(2000, 0, 6, 18, 14)) / 864e5;
  return (((days / synodic) % 1) + 1) % 1;
}
function moonName(p) {
  const names = ["new moon", "waxing crescent", "first quarter", "waxing gibbous", "full moon", "waning gibbous", "last quarter", "waning crescent"];
  return names[Math.floor(((p + 1 / 16) % 1) * 8)];
}

function dusk(profile, gh, r) {
  const total = gh?.contributions ?? 0;
  const words = profile.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z ]/g, "").split(/\s+/).filter(Boolean);
  const lines = words.length > 2 ? [words[0], words.slice(1).join(" ")] : words;
  const widest = Math.max(...lines.map((l) => l.length * 6 - 1));
  const cell = Math.min(12.5, 860 / widest);
  const oy = 104, lineH = 7 * cell + 24;
  const targets = [];
  lines.forEach((line, li) => {
    const ox = (W - (line.length * 6 - 1) * cell) / 2;
    [...line].forEach((ch, ci) => (GLYPHS[ch] ?? []).forEach((row, ry) => [...row].forEach((px, rx) => {
      if (px !== "#") return;
      const x = ox + (ci * 6 + rx) * cell, y = oy + li * lineH + ry * cell;
      targets.push([x, y - cell * 0.22], [x, y + cell * 0.28]);
    })));
  });
  const nameH = lines.length * lineH - 24;
  const birds = Math.min(Math.max(total, targets.length + 120), 900);

  const blob = (cx, cy, rx, ry, rot) => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    const x = Math.cos(a) * rx * d, y = Math.sin(a) * ry * d * (0.6 + 0.4 * Math.cos(a * 2));
    return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
  };
  const els = [];
  for (let i = 0; i < birds; i++) {
    const [ax, ay] = blob(250, 300, 170, 62, -0.35);
    const [cx, cy] = blob(640, 150, 230, 55, 0.25);
    const [ex, ey] = blob(760, 330, 150, 70, 0.6);
    const onName = i < targets.length;
    let bx, by;
    if (onName) [bx, by] = targets[i];
    else {
      const a = r() * Math.PI * 2, k = 1 + r() * 0.35;
      bx = W / 2 + Math.cos(a) * (widest * cell * 0.5 + 60) * k;
      by = oy + nameH / 2 + Math.sin(a) * (nameH * 0.5 + 40) * k;
    }
    const s = onName ? 1.75 : 0.7;
    els.push(`<g class="b${onName ? "" : " bx"}" style="--ax:${f(ax)}px;--ay:${f(ay)}px;--cx:${f(cx)}px;--cy:${f(cy)}px;--bx:${f(bx)}px;--by:${f(by)}px;--ex:${f(ex)}px;--ey:${f(ey)}px;animation-delay:${f(-((ax / W) * 0.8 + r() * 0.3))}s"><path class="w" style="animation-delay:${f(-r())}s" d="M${f(-3.4 * s)},0Q${f(-1.5 * s)},${f(-2.4 * s)} 0,0Q${f(1.5 * s)},${f(-2.4 * s)} ${f(3.4 * s)},0"/></g>`);
  }

  const current = profile.experience.find((e) => e.current) ?? profile.experience[0];
  const past = profile.experience.filter((e) => e !== current).map((e) => `ex-${e.role} @ ${e.company}`);
  const role = [current && `${current.role} @ ${current.company}`, ...past].filter(Boolean).join("  ·  ");
  const cy = oy + nameH + 58;
  return `
  <circle cx="760" cy="40" r="420" fill="url(#sun)"/>
  ${els.join("")}
  <text x="${W / 2}" y="${cy}" text-anchor="middle" font-family="${SERIF}" font-size="18" font-style="italic" fill="#2b2140">${esc(role)}</text>
  <text class="cap" x="${W / 2}" y="${cy + 24}" text-anchor="middle" font-family="${SERIF}" font-size="13" font-style="italic" fill="#3d2f55">${gh ? `${birds} starlings, one for every contribution this year` : "the flock grows with every contribution"}</text>`;
}

function night(profile, gh, r) {
  const cx = 500, cy = 790, R = 195, gold = "#d9b76e", ink = "#e9d7a5";
  const weeks = gh?.weeks ?? [];
  const days = weeks.flat();
  const total = gh?.contributions ?? 0;

  const ambient = Array.from({ length: 230 }, () => {
    const x = r() * W, y = 380 + r() * (HORIZON - 400);
    const fade = Math.min(1, Math.max(0, (y - 380) / 280));
    const tw = r() > 0.75 ? ` class="tw" style="animation-delay:${f(r() * 5)}s;animation-duration:${f(2.5 + r() * 3)}s"` : "";
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.5 + r() * 0.9)}" fill="#fff6dc" opacity="${f(fade * (0.25 + r() * 0.5))}"${tw}/>`;
  }).join("");

  const field = Array.from({ length: Math.min(total, 900) }, () => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * (R - 6), mag = r();
    const s = mag > 0.985 ? 1.6 : mag > 0.9 ? 1.05 : 0.55;
    const tw = mag > 0.9 ? ` class="tw" style="animation-delay:${f(r() * 5)}s;animation-duration:${f(2.5 + r() * 3)}s"` : "";
    return `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="${s}" fill="#fff6dc" opacity="${f(0.35 + mag * 0.6)}"${tw}/>`;
  }).join("");

  const grid = [0.33, 0.66].map((k) => `<circle cx="${cx}" cy="${cy}" r="${f(R * k)}" fill="none" stroke="${gold}" stroke-opacity=".22" stroke-dasharray="2 4"/>`).join("")
    + Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return `<line x1="${cx}" y1="${cy}" x2="${f(cx + Math.cos(a) * R)}" y2="${f(cy + Math.sin(a) * R)}" stroke="${gold}" stroke-opacity=".12"/>`;
    }).join("");

  const months = Array(12).fill(0);
  days.forEach((d) => { months[new Date(d.date + "T00:00:00Z").getUTCMonth()] += d.count; });
  const mMax = Math.max(...months, 1);
  const ring = Array.from({ length: 12 }, (_, m) => {
    const a0 = (m / 12) * Math.PI * 2 - Math.PI / 2, a1 = ((m + 1) / 12) * Math.PI * 2 - Math.PI / 2, mid = (a0 + a1) / 2;
    const ticks = Array.from({ length: 7 }, (_, k) => {
      const a = a0 + ((k + 0.5) / 7) * (a1 - a0);
      const len = 3 + (months[m] / mMax) * 14 * (0.75 + 0.25 * Math.sin(k + m));
      return `<line x1="${f(cx + Math.cos(a) * (R + 3))}" y1="${f(cy + Math.sin(a) * (R + 3))}" x2="${f(cx + Math.cos(a) * (R + 3 + len))}" y2="${f(cy + Math.sin(a) * (R + 3 + len))}" stroke="${gold}" stroke-width="1.6" opacity=".85"/>`;
    }).join("");
    const deg = (mid * 180) / Math.PI + 90, flip = deg > 90 && deg < 270 ? 180 : 0;
    return `${ticks}<line x1="${f(cx + Math.cos(a0) * R)}" y1="${f(cy + Math.sin(a0) * R)}" x2="${f(cx + Math.cos(a0) * (R + 46))}" y2="${f(cy + Math.sin(a0) * (R + 46))}" stroke="${gold}" stroke-opacity=".5"/>
    <text transform="translate(${f(cx + Math.cos(mid) * (R + 34))} ${f(cy + Math.sin(mid) * (R + 34))}) rotate(${f(deg + flip)})" text-anchor="middle" dy="3.5" font-family="${SERIF}" font-size="11" letter-spacing="2" fill="${ink}">${MONTHS[m].toUpperCase()}</text>`;
  }).join("");

  const LATIN = { Testing: "PROBATOR", Languages: "LINGUA", "CI / Cloud": "NUBES", "AI / Agentic": "COGITANS" };
  const quads = [[-0.62, -0.5], [0.55, -0.45], [-0.5, 0.48], [0.52, 0.5]];
  const constellations = profile.stack.slice(0, 4).map((g, gi) => {
    const [qx, qy] = quads[gi];
    const ccx = cx + qx * R * 0.72, ccy = cy + qy * R * 0.72;
    const pts = g.items.map((_, i) => {
      const a = (i / g.items.length) * Math.PI * 2 + r() * 0.5, d = 24 + r() * 34;
      return [ccx + Math.cos(a) * d * 1.25, ccy + Math.sin(a) * d];
    }).sort((p, q) => p[0] - q[0]);
    const lines = pts.slice(1).map((p, i) => `<line x1="${f(pts[i][0])}" y1="${f(pts[i][1])}" x2="${f(p[0])}" y2="${f(p[1])}" stroke="${gold}" stroke-width=".9" stroke-opacity=".75"/>`).join("");
    const stars = pts.map(([x, y], i) => {
      const s = i === 0 ? 4.4 : 2.6 + r() * 1.4;
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s + 3)}" fill="${gold}" opacity=".18"/><path class="spark" style="animation-delay:${f(r() * 6)}s" d="M${f(x)},${f(y - s * 1.9)}L${f(x + s * 0.35)},${f(y - s * 0.35)}L${f(x + s * 1.9)},${f(y)}L${f(x + s * 0.35)},${f(y + s * 0.35)}L${f(x)},${f(y + s * 1.9)}L${f(x - s * 0.35)},${f(y + s * 0.35)}L${f(x - s * 1.9)},${f(y)}L${f(x - s * 0.35)},${f(y - s * 0.35)}Z" fill="#fff4d0"/>
      <text x="${f(x + s + 5)}" y="${f(y + 3.5)}" font-family="${SERIF}" font-size="10" font-style="italic" fill="${ink}" opacity=".85">${esc(g.items[i].name)}</text>`;
    }).join("");
    const ly = qy < 0 ? Math.min(...pts.map((p) => p[1])) - 16 : Math.max(...pts.map((p) => p[1])) + 22;
    return `${lines}${stars}<text x="${f(ccx)}" y="${f(ly)}" text-anchor="middle" font-family="${SERIF}" font-size="11" letter-spacing="4" fill="${gold}">${esc(LATIN[g.group] ?? g.group.toUpperCase())}</text>`;
  }).join("");

  const busiest = months.indexOf(mMax);
  const legend = [
    gh ? `${total} stars: one per contribution` : "stars appear with each contribution",
    "constellations: the craft",
    "outer ring: the year by month",
    gh ? `brightest month: ${MONTHS[busiest]} (${mMax})` : "",
  ].filter(Boolean);
  const meteors = [[860, 430, 0], [360, 470, 6.5], [700, 980, 11]].map(([x, y, d]) => `<g class="meteor" style="animation-delay:${d}s"><line x1="${x}" y1="${y}" x2="${x + 90}" y2="${y - 48}" stroke="url(#trail)" stroke-width="1.6" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="1.8" fill="#fffbe8"/></g>`).join("");
  return `
  ${ambient}
  ${meteors}
  <circle cx="${cx}" cy="${cy}" r="${R + 46}" fill="none" stroke="${gold}" stroke-opacity=".5"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="#0e1b3c" fill-opacity=".9" stroke="${gold}" stroke-width="1.4"/>
  <g clip-path="url(#plan)"><g class="sky">${field}</g>${grid}</g>
  ${ring}
  ${constellations}
  <text x="40" y="660" font-family="${SERIF}" font-size="11" letter-spacing="4" fill="${gold}">ATLAS COELESTIS</text>
  <text x="38" y="694" font-family="${SERIF}" font-size="26" font-style="italic" fill="#f4e6bd">the craft</text>
  <line x1="40" y1="712" x2="210" y2="712" stroke="${gold}" stroke-opacity=".6"/>
  <text x="40" y="732" font-family="${SERIF}" font-size="12" fill="${ink}">${esc(profile.title)}, charted</text>
  <text x="790" y="880" font-family="${SERIF}" font-size="10" letter-spacing="3" fill="${gold}">EXPLICATIO</text>
  ${legend.map((l, i) => `<text x="790" y="${902 + i * 19}" font-family="${SERIF}" font-size="12" font-style="italic" fill="${ink}">${esc(l)}</text>`).join("")}`;
}

function surface(r, now) {
  const mx = 820, my = 1090, mr = 26;
  const p = moonPhase(now);
  const lit = p < 0.5 ? p * 2 : (1 - p) * 2;
  const shift = (p < 0.5 ? -1 : 1) * 2 * mr * lit;
  const glints = Array.from({ length: 16 }, (_, i) => {
    const y = HORIZON + 6 + i * 7.5 + r() * 3, w = (34 - i * 1.6) * (0.6 + r() * 0.6) * (0.4 + lit * 0.6);
    return `<rect class="glint" style="animation-delay:${f(r() * 3)}s" x="${f(mx - w / 2 + (r() - 0.5) * 10)}" y="${f(y)}" width="${f(w)}" height="1.6" rx=".8" fill="#fdf3d2" opacity="${f((0.75 - i * 0.04) * (0.3 + lit * 0.7))}"/>`;
  }).join("");
  const wave = (y, amp, op, dur) => {
    const d = (ph) => {
      let s = `M0,${y}`;
      for (let x = 0; x <= W; x += 50) s += ` Q${x + 25},${f(y + (((x / 50) + ph) % 2 ? amp : -amp))} ${x + 50},${y}`;
      return s;
    };
    return `<path d="${d(0)}" fill="none" stroke="#9fc4e6" stroke-width="1" opacity="${op}"><animate attributeName="d" values="${d(0)};${d(1)};${d(0)}" dur="${dur}s" repeatCount="indefinite"/></path>`;
  };
  return `
  <circle cx="${mx}" cy="${my}" r="150" fill="url(#moonglow)" opacity="${f(0.35 + lit * 0.65)}"/>
  <mask id="phase"><rect x="${mx - mr - 2}" y="${my - mr - 2}" width="${mr * 2 + 4}" height="${mr * 2 + 4}" fill="#fff"/><circle cx="${f(mx + shift)}" cy="${my}" r="${mr + 0.5}" fill="#000"/></mask>
  <circle cx="${mx}" cy="${my}" r="${mr}" fill="#1c2a48"/>
  <circle cx="${mx}" cy="${my}" r="${mr}" fill="#fbf1d0" mask="url(#phase)"/>
  <text x="${mx}" y="${my + mr + 22}" text-anchor="middle" font-family="${SERIF}" font-size="11" font-style="italic" fill="#9fb7d6">tonight: ${moonName(p)}</text>
  <rect x="0" y="${HORIZON - 1}" width="${W}" height="2" fill="#bcd6f0" opacity=".35"/>
  ${glints}
  ${wave(HORIZON + 10, 2.5, 0.22, 7)}${wave(HORIZON + 28, 3, 0.14, 9)}${wave(HORIZON + 52, 3.5, 0.08, 11)}`;
}

function abyss(gh, r) {
  const hues = ["#5eead4", "#a78bfa", "#f0abfc", "#67e8f9", "#93c5fd"];
  const repos = gh?.repoList?.length ? gh.repoList : [{}, {}, {}];
  const slots = [[190, 1440], [430, 1600], [580, 1410], [780, 1590], [890, 1430]];
  const snow = Array.from({ length: 130 }, () => {
    const x = r() * W, y0 = HORIZON - 800 * r(), t = 16 + r() * 22;
    return `<circle class="sn" cx="${f(x)}" cy="${f(y0)}" r="${f(0.5 + r() * 1.3)}" fill="#cfe9ff" opacity="${f(0.15 + r() * 0.45)}" style="--dx:${f((r() - 0.5) * 60)}px;animation-duration:${f(t)}s;animation-delay:${f(-r() * t)}s"/>`;
  }).join("");
  const shafts = [[180, 90], [420, 130], [640, 100], [860, 120]].map(([x, w], i) => `<path class="shaft" style="animation-delay:${i * 1.7}s" d="M${x - w / 2},${HORIZON} L${x + w / 2},${HORIZON} L${x + w * 1.6},${HORIZON + 560} L${x - w * 0.4},${HORIZON + 560}Z" fill="url(#shaft)"/>`).join("");

  const jellies = repos.slice(0, 5).map((repo, i) => {
    const [x, y] = slots[i];
    const act = repo.activity ?? 0.4;
    const size = 38 + Math.min(repo.stars ?? 0, 40) * 4 + act * 22;
    const hue = hues[i % hues.length];
    const w = size * 0.62, h = size * 0.55, pulse = f(3.4 - act * 1.6);
    const nT = 5 + Math.min(repo.stars ?? 0, 6) + (act > 0.5 ? 2 : 0);
    const tentacles = Array.from({ length: nT }, (_, k) => {
      const tx = -w * 0.8 + (k / (nT - 1)) * w * 1.6, seg = (size * (0.9 + r() * 0.9)) / 4, a = 5 + r() * 7;
      const d = (s) => `M${f(tx)},${f(h * 0.12)} q${f(s * a)},${f(seg / 2)} 0,${f(seg)} t0,${f(seg)} t0,${f(seg)} t0,${f(seg)}`;
      return `<path d="${d(1)}" fill="none" stroke="${hue}" stroke-width="${f(0.8 + r() * 0.9)}" stroke-linecap="round" opacity="${f(0.35 + r() * 0.4)}"><animate attributeName="d" values="${d(1)};${d(-1)};${d(1)}" dur="${f(3.5 + r() * 2.5)}s" repeatCount="indefinite"/></path>`;
    }).join("");
    const bell = `M${f(-w)},${f(h * 0.12)} C${f(-w)},${f(-h * 1.35)} ${f(w)},${f(-h * 1.35)} ${f(w)},${f(h * 0.12)} Q${f(w * 0.5)},${f(h * 0.32)} 0,${f(h * 0.14)} Q${f(-w * 0.5)},${f(h * 0.32)} ${f(-w)},${f(h * 0.12)}Z`;
    const label = repo.name ? `<text y="${f(size * 1.55 + 18)}" text-anchor="middle" font-family="${MONO}" font-size="12" fill="${hue}" opacity=".9">${esc(repo.name)}</text>
      <text y="${f(size * 1.55 + 33)}" text-anchor="middle" font-family="${MONO}" font-size="10" fill="#8fb3c9" opacity=".65">${esc([repo.lang, `★ ${repo.stars}`].filter(Boolean).join(" · "))}</text>` : "";
    return `<g transform="translate(${x} ${y})"><g class="drift" style="animation-duration:${f(9 + r() * 5)}s;animation-delay:${f(-r() * 8)}s">
      <circle r="${f(size * 1.5)}" cy="${f(-h * 0.2)}" fill="url(#jg${i})" class="halo" style="animation-duration:${pulse}s"/>
      ${tentacles}
      <path d="M${f(-w * 0.18)},${f(h * 0.1)} q${f(w * 0.1)},${f(size * 0.5)} ${f(w * 0.05)},${f(size * 0.95)} M${f(w * 0.15)},${f(h * 0.1)} q${f(-w * 0.12)},${f(size * 0.45)} ${f(-w * 0.02)},${f(size * 1.05)}" fill="none" stroke="${hue}" stroke-width="3" stroke-linecap="round" opacity=".45"/>
      <g class="bell" style="animation-duration:${pulse}s"><path d="${bell}" fill="url(#jb${i})" stroke="${hue}" stroke-width="1.2" stroke-opacity=".8"/>
      <path d="M${f(-w * 0.55)},${f(-h * 0.2)} Q0,${f(-h * 1.05)} ${f(w * 0.55)},${f(-h * 0.2)}" fill="none" stroke="#fff" stroke-opacity=".25"/>
      ${[0, 1, 2, 3].map((k) => `<circle cx="${f(-w * 0.45 + k * w * 0.3)}" cy="${f(-h * 0.05)}" r="${f(1.3 + r())}" fill="#fff" opacity=".7"/>`).join("")}</g>
      ${label}</g></g>`;
  }).join("");
  const jellyDefs = hues.map((hue, i) => `<radialGradient id="jg${i}"><stop offset="0" stop-color="${hue}" stop-opacity=".32"/><stop offset=".45" stop-color="${hue}" stop-opacity=".08"/><stop offset="1" stop-color="${hue}" stop-opacity="0"/></radialGradient>
    <radialGradient id="jb${i}" cx=".5" cy=".75" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".4" stop-color="${hue}" stop-opacity=".45"/><stop offset="1" stop-color="${hue}" stop-opacity=".08"/></radialGradient>`).join("");

  const weeks = gh?.weeks ?? [];
  const max = Math.max(1, ...weeks.flat().map((d) => d.count));
  const seabed = weeks.map((wk, wi) => wk.map((d, di) => {
    if (!d.count) return "";
    const depth = di / 6, y = 1868 + di * 11, spread = 1.55 + depth * 0.5;
    const x = W / 2 + (wi - weeks.length / 2) * 17.5 * spread / 1.8, k = d.count / max;
    const tw = k > 0.55 ? ` class="tw" style="animation-delay:${f(r() * 4)}s"` : "";
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + k * 2.8 + depth * 0.7)}" fill="${k > 0.6 ? "#a5f3fc" : "#2dd4bf"}" opacity="${f(0.25 + k * 0.7)}"${tw}/>`;
  }).join("")).join("");

  return {
    defs: jellyDefs,
    body: `
  <g clip-path="url(#water)">${shafts}<g filter="url(#blur)">${snow}</g></g>
  ${jellies}
  <path d="M0,1850 C160,1838 300,1856 470,1846 S780,1834 1000,1848 L1000,${H} L0,${H}Z" fill="#02070d" opacity=".75"/>
  ${seabed}
  <text x="${W / 2}" y="1822" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="2" fill="#6fa8c7" opacity=".85">${gh ? `THE SEABED GLOWS WITH ${gh.contributions} CONTRIBUTIONS` : "THE SEABED LIGHTS UP AFTER THE FIRST RUN"}</text>`,
  };
}

export function descentSvg(profile, gh, now = Date.now()) {
  const r = rng(hash(profile.handle + "descent"));
  const deep = abyss(gh, r);
  const chapter = (y, text, fill) => `<text x="28" y="${y}" font-family="${MONO}" font-size="11" letter-spacing="3" fill="${fill}">${text}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(profile.name)}, ${esc(profile.title)}: a living profile descending from dusk sky to deep sea">
<style>
  .b{animation:fly 20s cubic-bezier(.45,.05,.55,.95) infinite;transform:translate(var(--bx),var(--by))}
  @keyframes fly{0%{transform:translate(var(--ax),var(--ay))}14%,46%{transform:translate(var(--bx),var(--by))}62%{transform:translate(var(--cx),var(--cy))}80%{transform:translate(var(--ex),var(--ey))}100%{transform:translate(var(--ax),var(--ay))}}
  .w{fill:none;stroke:#1b1426;stroke-width:1.5;stroke-linecap:round;animation:flap .32s ease-in-out infinite alternate;transform-origin:0 0}
  .bx .w{stroke-opacity:.45}
  @keyframes flap{to{transform:scaleY(-.45)}}
  .cap{animation:cap 20s ease-in-out infinite}
  @keyframes cap{0%,10%{opacity:0}18%,44%{opacity:1}52%,100%{opacity:0}}
  .tw{animation:tw ease-in-out infinite;animation-duration:3.5s}
  @keyframes tw{50%{opacity:.2}}
  .spark{animation:tw 5s ease-in-out infinite}
  .sky{animation:turn 480s linear infinite;transform-origin:500px 790px}
  @keyframes turn{to{transform:rotate(360deg)}}
  .meteor{opacity:0;animation:meteor 17s linear infinite}
  @keyframes meteor{0%{opacity:0;transform:translate(0,0)}1%{opacity:1}5%{opacity:0;transform:translate(-300px,160px)}100%{opacity:0;transform:translate(-300px,160px)}}
  .glint{animation:glint 2.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
  @keyframes glint{50%{opacity:.15;transform:scaleX(.6)}}
  .shaft{animation:shaft 9s ease-in-out infinite}
  @keyframes shaft{50%{opacity:.35}}
  .sn{animation:fall linear infinite}
  @keyframes fall{to{transform:translate(var(--dx),800px)}}
  .drift{animation:drift ease-in-out infinite alternate}
  @keyframes drift{from{transform:translateY(-9px)}to{transform:translateY(11px)}}
  .bell{transform-box:fill-box;transform-origin:50% 90%;animation:pulse ease-in-out infinite}
  @keyframes pulse{0%,100%{transform:scale(1,1)}45%{transform:scale(1.07,.86)}}
  .halo{animation:halo ease-in-out infinite}
  @keyframes halo{0%,100%{opacity:.75}45%{opacity:1}}
  @media (prefers-reduced-motion: reduce){*{animation:none!important}.cap{opacity:1}}
</style>
<defs>
  <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f3b489"/><stop offset=".07" stop-color="#e8998a"/><stop offset=".17" stop-color="#b0739a"/><stop offset=".28" stop-color="#5e4a86"/>
    <stop offset=".39" stop-color="#2a2b62"/><stop offset=".53" stop-color="#121a42"/><stop offset=".85" stop-color="#0a1330"/><stop offset="1" stop-color="#1a2d52"/>
  </linearGradient>
  <linearGradient id="seag" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#15385a"/><stop offset=".06" stop-color="#0c2640"/><stop offset=".4" stop-color="#06172a"/><stop offset=".75" stop-color="#030c18"/><stop offset="1" stop-color="#01050b"/>
  </linearGradient>
  <radialGradient id="sun"><stop offset="0" stop-color="#ffe7b8" stop-opacity=".75"/><stop offset=".45" stop-color="#ffc58a" stop-opacity=".25"/><stop offset="1" stop-color="#ffc58a" stop-opacity="0"/></radialGradient>
  <radialGradient id="moonglow"><stop offset="0" stop-color="#fdf3d2" stop-opacity=".35"/><stop offset=".35" stop-color="#9fc4e6" stop-opacity=".1"/><stop offset="1" stop-color="#9fc4e6" stop-opacity="0"/></radialGradient>
  <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd3f0" stop-opacity=".12"/><stop offset="1" stop-color="#9fd3f0" stop-opacity="0"/></linearGradient>
  <linearGradient id="trail" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#fffbe8" stop-opacity="0"/></linearGradient>
  <clipPath id="plan"><circle cx="500" cy="790" r="195"/></clipPath>
  <clipPath id="water"><rect y="${HORIZON}" width="${W}" height="${H - HORIZON}"/></clipPath>
  <filter id="blur"><feGaussianBlur stdDeviation="1.3"/></filter>
  ${deep.defs}
</defs>
<rect width="${W}" height="${HORIZON}" fill="url(#skyg)"/>
<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#seag)"/>
${dusk(profile, gh, r)}
${night(profile, gh, r)}
${surface(r, now)}
${deep.body}
${chapter(34, "I · DUSK", "#6a4a66")}
${chapter(560, "II · NIGHT", "#8fa3c9")}
${chapter(1166, "III · SURFACE", "#9fb7d6")}
${chapter(1300, "IV · ABYSS", "#6fa8c7")}
<text x="${W - 28}" y="1300" text-anchor="end" font-family="${MONO}" font-size="11" letter-spacing="2" fill="#6fa8c7" opacity=".85">EVERY CREATURE IS A REPOSITORY</text>
<text x="${W / 2}" y="1988" text-anchor="middle" font-family="${MONO}" font-size="10" letter-spacing="2" fill="#3f6680">REGENERATED HOURLY FROM LIVE GITHUB DATA${gh?.fetchedAt ? ` · ${gh.fetchedAt.slice(0, 10)}` : ""}</text>
</svg>
`;
}
