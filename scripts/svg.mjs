export const C = {
  bg: "#0b0f14",
  panel: "#0f151c",
  bar: "#121a23",
  border: "#1f2a37",
  text: "#dbe2ea",
  muted: "#8b95a3",
  dim: "#4b5563",
  green: "#3ddc97",
  red: "#ff6b6b",
  amber: "#f5a524",
  blue: "#60a5fa",
  violet: "#a78bfa",
  cyan: "#22d3ee",
};
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Elements are visible by default and animate *from* hidden, so reduced-motion
// (which disables animation) always shows the finished frame.
const BASE_CSS = `
  .mono{font-family:${MONO}} .sans{font-family:${SANS}}
  .in{animation:in .45s cubic-bezier(.2,.7,.2,1) both}
  .fade{animation:fade .35s ease both}
  .swap-out{animation:swapout .01s linear both}
  @keyframes in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  @keyframes fade{from{opacity:0}to{opacity:1}}
  @keyframes swapout{from{opacity:1}to{opacity:0}}
  @keyframes blink{50%{opacity:0}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media (prefers-reduced-motion: reduce){*{animation:none!important}.swap-out{opacity:0}}
`;

function frame({ w, h, title, body, css = "", label }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label ?? title)}">
<style>${BASE_CSS}${css}</style>
<defs>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#ffffff" opacity=".045"/></pattern>
  <clipPath id="win"><rect width="${w}" height="${h}" rx="14"/></clipPath>
</defs>
<g clip-path="url(#win)">
  <rect width="${w}" height="${h}" fill="${C.bg}"/>
  <rect width="${w}" height="${h}" fill="url(#dots)"/>
  <rect width="${w}" height="40" fill="${C.bar}"/>
  <line x1="0" y1="40.5" x2="${w}" y2="40.5" stroke="${C.border}"/>
  <circle cx="22" cy="20" r="6" fill="#ff5f57"/><circle cx="42" cy="20" r="6" fill="#febc2e"/><circle cx="62" cy="20" r="6" fill="#28c840"/>
  <text x="${w / 2}" y="25" text-anchor="middle" class="mono" font-size="13" fill="${C.muted}">${esc(title)}</text>
  ${body}
</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="14" fill="none" stroke="${C.border}"/>
</svg>
`;
}

const delay = (s) => `style="animation-delay:${s.toFixed(2)}s"`;

// Reveals a line of text left-to-right like typing by sliding a cover off it.
function typed({ x, y, text, size, fill, start, cps = 38, cls = "mono", weight = 400 }) {
  const width = Math.ceil(text.length * size * 0.62) + 12;
  const dur = Math.max(text.length / cps, 0.3);
  const id = `t${Math.round(x)}_${Math.round(y)}`;
  return `<style>#${id}{animation:${id} ${dur.toFixed(2)}s steps(${text.length}) ${start.toFixed(2)}s both}
    @keyframes ${id}{from{transform:translateX(0)}to{transform:translateX(${width}px)}}</style>
  <text x="${x}" y="${y}" class="${cls}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(text)}</text>
  <rect id="${id}" x="${x - 2}" y="${y - size}" width="${width}" height="${size + 8}" fill="${C.bg}"/>`;
}

export function heroSvg(p) {
  const w = 1000, h = 336;
  const current = p.experience.find((e) => e.current);
  const past = p.experience.filter((e) => !e.current).map((e) => `ex-${e.role} @ ${e.company}`);
  const roleLine = [`${current.role} @ ${current.company}`, ...past].join("  ·  ");
  const nameW = Math.round(p.name.length * 30.5) + 24;
  const roleW = Math.round(roleLine.length * 9.7) + 24;
  const tagW = Math.round(p.tagline.length * 7.4) + 24;
  const cycle = 9;
  const targets = [
    { x: 44, y: 110, w: nameW, h: 66, label: `getByRole('heading', { name: '${p.name}' })` },
    { x: 44, y: 190, w: roleW, h: 30, label: `getByText('${current.role} @ ${current.company}')` },
    { x: 44, y: 231, w: tagW, h: 30, label: `getByTestId('tagline')` },
  ];
  const overlays = targets
    .map(
      (t, i) => `<g class="ov ov${i}" style="animation-delay:${(i * cycle) / 3 + 2.4}s">
    <rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="6" fill="${C.blue}" fill-opacity=".12" stroke="${C.blue}" stroke-width="1.5"/>
    <rect x="${t.x + t.w - 9}" y="${t.y + t.h - 9}" width="9" height="9" rx="2" fill="${C.blue}"/>
    <text x="150" y="303" class="mono" font-size="13" fill="${C.text}">${esc(t.label)}</text>
  </g>`,
    )
    .join("\n");
  const locatorBar = `<g class="in" ${delay(2)}>
    <rect x="44" y="283" width="620" height="30" rx="7" fill="${C.panel}" stroke="${C.border}"/>
    <text x="58" y="303" class="mono" font-size="13" fill="${C.blue}" font-weight="700">⌖ Locator</text>
    <line x1="140" y1="289" x2="140" y2="307" stroke="${C.border}"/>
  </g>`;

  const checks = ["toBeVisible()", `toHaveText('${current.role}')`, "toBeHireable()"];
  const panelX = 684;
  const panel = `
  <g class="in" ${delay(1.6)}>
    <rect x="${panelX}" y="70" width="284" height="243" rx="10" fill="${C.panel}" stroke="${C.border}"/>
    <text x="${panelX + 16}" y="96" class="mono" font-size="12" fill="${C.muted}">ASSERTIONS</text>
    <circle cx="${panelX + 264}" cy="92" r="4" fill="${C.green}"><animate attributeName="opacity" values="1;.25;1" dur="1.6s" repeatCount="indefinite"/></circle>
    ${checks
      .map(
        (c, i) => `<g class="in" ${delay(2.6 + i * 3)}>
      <rect x="${panelX + 14}" y="${114 + i * 62}" width="256" height="46" rx="8" fill="${C.green}" fill-opacity=".07" stroke="${C.green}" stroke-opacity=".35"/>
      <text x="${panelX + 28}" y="${142 + i * 62}" class="mono" font-size="14" fill="${C.green}" font-weight="700">✓</text>
      <text x="${panelX + 48}" y="${142 + i * 62}" class="mono" font-size="12.5"><tspan fill="${C.muted}">expect(me).</tspan><tspan fill="${C.text}">${esc(c)}</tspan></text>
    </g>`,
      )
      .join("")}
  </g>`;

  const css = `
    .ov{opacity:0;animation:ov ${cycle}s ease-in-out infinite}
    @keyframes ov{0%{opacity:0}4%{opacity:1}30%{opacity:1}34%{opacity:0}100%{opacity:0}}
    .grad{animation:hue 8s linear infinite}
    @keyframes hue{50%{filter:hue-rotate(35deg)}}
    @media (prefers-reduced-motion: reduce){.ov0{opacity:1}}
  `;
  const body = `
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${C.green}"/><stop offset=".5" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.violet}"/></linearGradient></defs>
  ${typed({ x: 56, y: 86, text: "// system under test", size: 14, fill: C.dim, start: 0.2 })}
  <text x="56" y="160" class="sans in grad" ${delay(0.7)} font-size="58" font-weight="800" letter-spacing="-1" fill="url(#g)">${esc(p.name)}</text>
  <text x="56" y="211" class="mono in" ${delay(1.0)} font-size="16" fill="${C.text}">${esc(roleLine)}</text>
  <text x="56" y="252" class="sans in" ${delay(1.3)} font-size="17" fill="${C.muted}">${esc(p.tagline)}</text>
  ${locatorBar}
  ${overlays}
  ${panel}
  `;
  return frame({ w, h, title: `${p.handle.toLowerCase()}@readme.spec — inspector`, body, css, label: `${p.name} — ${roleLine}` });
}

function fill(template, gh) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (gh && gh[k] != null ? Number(gh[k]).toLocaleString("en-US") : "…"));
}

export function resolveSpec(p, gh) {
  let n = 0;
  return p.spec.map((group) => ({
    describe: group.describe,
    tests: group.tests.map((t) => {
      const status = t.skip ? "skip" : t.live && !gh ? "pending" : "pass";
      return {
        n: ++n,
        live: t.live ?? null,
        title: fill(t.title, gh),
        status,
        note: t.skip ? `skipped: ${t.skip}` : status === "pending" ? "awaiting first CI run" : null,
        ms: t.ms,
        steps: t.steps.map((s) => fill(s, gh)),
      };
    }),
  }));
}

export function suiteSvg(p, gh, runDate) {
  const groups = resolveSpec(p, gh);
  const tests = groups.flatMap((g) => g.tests);
  const passed = tests.filter((t) => t.status === "pass").length;
  const skipped = tests.filter((t) => t.status === "skip").length;
  const pending = tests.filter((t) => t.status === "pending").length;
  const totalMs = tests.reduce((a, t) => a + t.ms, 0);

  const w = 1000, lh = 25;
  let y = 76, t = 1.5;
  const rows = [];
  const cmd = `$ npx playwright test ${p.handle.toLowerCase()}.spec.ts --reporter=list`;
  rows.push(typed({ x: 32, y, text: cmd, size: 15, fill: C.text, start: 0.3, cps: 48 }));
  y += lh;
  rows.push(`<text x="32" y="${y}" class="mono fade" ${delay(t)} font-size="14" fill="${C.muted}">Running ${tests.length} tests using 4 workers</text>`);
  y += lh * 0.6;
  t += 0.4;

  for (const g of groups) {
    y += lh;
    rows.push(`<text x="32" y="${y}" class="mono fade" ${delay(t)} font-size="14" fill="${C.blue}" font-weight="600">${esc(p.name.split(" ")[0].toLowerCase())} › ${esc(g.describe)}</text>`);
    t += 0.2;
    for (const test of g.tests) {
      y += lh;
      const color = { pass: C.green, skip: C.amber, pending: C.muted }[test.status];
      const glyph = { pass: "✓", skip: "–", pending: "◌" }[test.status];
      const right = test.note ? `(${test.note})` : `(${test.ms}ms)`;
      rows.push(`<g class="fade" ${delay(t)}>
    <g class="swap-out" ${delay(t + 0.42)}><circle cx="52" cy="${y - 5}" r="5.5" fill="none" stroke="${C.cyan}" stroke-width="2" stroke-dasharray="20 15" style="transform-origin:52px ${y - 5}px;animation:spin .6s linear infinite"/></g>
    <text x="46" y="${y}" class="mono fade" ${delay(t + 0.42)} font-size="15" fill="${color}" font-weight="700">${glyph}</text>
    <text x="72" y="${y}" class="mono" font-size="14" fill="${C.dim}">${String(test.n).padStart(2, " ")}</text>
    <text x="100" y="${y}" class="mono" font-size="14" fill="${test.status === "pass" ? C.text : C.muted}">${esc(test.title)}</text>
    <text x="${w - 32}" y="${y}" text-anchor="end" class="mono fade" ${delay(t + 0.42)} font-size="13" fill="${test.status === "pass" ? C.dim : color}">${esc(right)}</text>
  </g>`);
      t += 0.45;
    }
  }

  y += lh * 1.5;
  const summary = [
    [`${passed} passed`, C.green],
    skipped && [`${skipped} skipped`, C.amber],
    pending && [`${pending} pending`, C.muted],
  ]
    .filter(Boolean)
    .map(([label, c]) => `<tspan fill="${c}">${esc(label)}</tspan>`)
    .join(`<tspan fill="${C.dim}">  ·  </tspan>`);
  rows.push(`<text x="32" y="${y}" class="mono in" ${delay(t + 0.2)} font-size="16" font-weight="700">${summary}<tspan fill="${C.dim}" font-weight="400" font-size="14">  (${(totalMs / 1000).toFixed(1)}s)</tspan></text>`);
  y += lh;
  rows.push(`<text x="32" y="${y}" class="mono in" ${delay(t + 0.5)} font-size="14" fill="${C.muted}">0 bugs escaped to production <tspan fill="${C.dim}">(that we know of)</tspan></text>`);
  rows.push(`<text x="${w - 32}" y="${y}" text-anchor="end" class="mono in" ${delay(t + 0.5)} font-size="12" fill="${C.dim}">last run · ${esc(runDate)}</text>`);
  y += 26;

  const h = Math.round(y + 14);
  const css = `.prog{transform-box:fill-box;transform-origin:left;animation:prog ${(t - 1.5).toFixed(2)}s linear 1.5s both}
    @keyframes prog{from{transform:scaleX(0)}to{transform:scaleX(1)}}`;
  const body = rows.join("\n") + `\n<rect x="0" y="${h - 4}" width="${w}" height="4" fill="${C.border}"/><rect class="prog" x="0" y="${h - 4}" width="${w}" height="4" fill="${C.green}"/>`;
  return frame({ w, h, title: `${p.handle.toLowerCase()}.spec.ts — playwright test`, body, css, label: `Test run: ${passed} passed, ${skipped} skipped` });
}

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function iconGlyph(item, icons, x, y, size = 22) {
  const icon = item.icon && icons[item.icon];
  let hex = item.hex ?? icon?.hex ?? C.text;
  if (lum(hex) < 0.08) hex = C.text;
  if (icon) {
    return `<path transform="translate(${x} ${y}) scale(${size / 24})" d="${icon.path}" fill="${hex}"/>`;
  }
  const label = item.mono ?? item.name.slice(0, 2);
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="5" fill="${hex}" fill-opacity=".16" stroke="${hex}" stroke-opacity=".8"/>
    <text x="${x + size / 2}" y="${y + size / 2 + 3.5}" text-anchor="middle" class="mono" font-size="${label.length > 2 ? 8.5 : 10}" font-weight="800" fill="${hex}">${esc(label)}</text>`;
}

export function stackSvg(p, icons) {
  const w = 1000;
  const cols = p.stack.length;
  const colW = (w - 48) / cols;
  const rowH = 38;
  const maxItems = Math.max(...p.stack.map((g) => g.items.length));
  const count = p.stack.reduce((a, g) => a + g.items.length, 0);
  let t = 0.2;
  const body = p.stack
    .map((g, ci) => {
      const x = 24 + ci * colW;
      const head = `<g class="in" ${delay(t)}>
      <rect x="${x + 6}" y="62" width="${colW - 12}" height="34" rx="8" fill="${g.color}" fill-opacity=".08" stroke="${g.color}" stroke-opacity=".35"/>
      <text x="${x + 20}" y="84" class="mono" font-size="14" font-weight="700" fill="${g.color}">▾ ${esc(g.group.toLowerCase())}/</text>
      <text x="${x + colW - 20}" y="84" text-anchor="end" class="mono" font-size="12" fill="${C.dim}">${g.items.length}</text>
    </g>`;
      t += 0.12;
      const items = g.items
        .map((item, i) => {
          const y = 112 + i * rowH;
          const last = i === g.items.length - 1;
          const out = `<g class="in" ${delay(t)}>
        <text x="${x + 18}" y="${y + 17}" class="mono" font-size="14" fill="${C.dim}">${last ? "└─" : "├─"}</text>
        ${iconGlyph(item, icons, x + 44, y + 1)}
        <text x="${x + 76}" y="${y + 17}" class="mono" font-size="14" fill="${C.text}">${esc(item.name)}</text>
      </g>`;
          t += 0.07;
          return out;
        })
        .join("");
      return head + items;
    })
    .join("\n");
  const fy = 112 + maxItems * rowH + 18;
  const footer = `<line x1="24" y1="${fy - 22}" x2="${w - 24}" y2="${fy - 22}" stroke="${C.border}" stroke-dasharray="3 5"/>
  <g class="in" ${delay(t + 0.2)}>
    <text x="32" y="${fy}" class="mono" font-size="14" fill="${C.muted}">$ npm audit</text>
    <text x="150" y="${fy}" class="mono" font-size="14" fill="${C.green}">found 0 vulnerabilities</text>
    <text x="${w - 32}" y="${fy}" text-anchor="end" class="mono" font-size="13" fill="${C.dim}">exploring → ${esc(p.focus[0].toLowerCase())}</text>
  </g>`;
  return frame({ w, h: fy + 24, title: `stack.lock — ${count} packages resolved`, body: body + footer, label: `Tech stack: ${p.stack.flatMap((g) => g.items.map((i) => i.name)).join(", ")}` });
}

export function historySvg(gh) {
  const w = 1000, cell = 14, gap = 3, x0 = 32, y0 = 90;
  const weeks = gh?.weeks ?? Array.from({ length: 53 }, () => Array.from({ length: 7 }, () => ({ count: 0 })));
  const counts = weeks.flat().map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const q = (f) => counts[Math.floor(f * (counts.length - 1))] ?? 1;
  const levels = [q(0.25), q(0.5), q(0.75)];
  const palette = ["#141b24", "#11412f", "#177a52", "#27ad74", C.green];
  const level = (c) => (c <= 0 ? 0 : c <= levels[0] ? 1 : c <= levels[1] ? 2 : c <= levels[2] ? 3 : 4);
  const step = cell + gap;

  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((wk, i) => {
    if (!wk[0]?.date) return;
    const m = new Date(wk[0].date + "T00:00:00Z").getUTCMonth();
    if (m !== lastMonth && i > 0 && i < weeks.length - 2) {
      monthLabels.push(`<text x="${x0 + i * step}" y="${y0 - 10}" class="mono" font-size="11" fill="${C.dim}">${"JanFebMarAprMayJunJulAugSepOctNovDec".slice(m * 3, m * 3 + 3)}</text>`);
    }
    lastMonth = m;
  });

  const cells = weeks
    .map((wk, i) => {
      // GitHub's first week can be partial; align it to the bottom like the real graph.
      const offset = i === 0 ? 7 - wk.length : 0;
      const rects = wk
        .map((d, j) => `<rect x="${x0 + i * step}" y="${y0 + (j + offset) * step}" width="${cell}" height="${cell}" rx="3" fill="${palette[level(d.count)]}"><title>${esc(d.date ?? "")}: ${d.count}</title></rect>`)
        .join("");
      return `<g class="fade" ${delay(0.3 + i * 0.025)}>${rects}</g>`;
    })
    .join("\n");

  const gridW = weeks.length * step - gap;
  const gridH = 7 * step - gap;
  const scan = `<rect class="scan" x="${x0}" y="${y0 - 4}" width="2" height="${gridH + 8}" fill="${C.cyan}"/>`;
  const pendingNote = gh
    ? ""
    : `<rect x="${w / 2 - 290}" y="${y0 + gridH / 2 - 18}" width="580" height="34" rx="8" fill="${C.bg}" stroke="${C.border}"/>
       <text x="${w / 2}" y="${y0 + gridH / 2 + 4}" text-anchor="middle" class="mono" font-size="13" fill="${C.muted}">◌ awaiting first CI run: the readme.spec workflow fills this in hourly</text>`;

  const fmt = (v, suffix = "") => (gh && v != null ? Number(v).toLocaleString("en-US") + suffix : "—");
  const stats = [
    [gh?.hiddenPrivate ? `runs · ${fmt(gh.hiddenPrivate)} private` : "total runs", fmt(gh?.contributions), C.text],
    ["current streak", fmt(gh?.currentStreak, "d"), C.green],
    ["longest streak", fmt(gh?.longestStreak, "d"), C.green],
    ["pull requests", fmt(gh?.pullRequests), C.blue],
    ["public repos", fmt(gh?.repos), C.violet],
    ["stars earned", fmt(gh?.stars), C.amber],
  ];
  const ty = y0 + gridH + 26;
  const tileW = (w - 64 - 5 * 12) / 6;
  const tiles = stats
    .map(([k, v, c], i) => {
      const x = x0 + i * (tileW + 12);
      return `<g class="in" ${delay(1.4 + i * 0.1)}>
    <rect x="${x}" y="${ty}" width="${tileW}" height="62" rx="9" fill="${C.panel}" stroke="${C.border}"/>
    <rect x="${x}" y="${ty + 14}" width="3" height="34" rx="1.5" fill="${c}"/>
    <text x="${x + 16}" y="${ty + 30}" class="mono" font-size="20" font-weight="800" fill="${c}">${v}</text>
    <text x="${x + 16}" y="${ty + 49}" class="mono" font-size="11" fill="${C.muted}">${k}</text>
  </g>`;
    })
    .join("");

  let ly = ty + 62 + 40;
  let langBlock = "";
  if (gh?.languages?.length) {
    const barW = w - 64;
    let lx = x0;
    const segs = gh.languages
      .map((l) => {
        const sw = (l.pct / 100) * barW;
        const out = `<rect x="${lx}" y="${ly}" width="${Math.max(sw - 2, 1)}" height="10" fill="${l.color}"/>`;
        lx += sw;
        return out;
      })
      .join("");
    let tx = x0;
    const legend = gh.languages
      .map((l, i) => {
        const label = `${l.name} ${l.pct}%`;
        const out = `<g class="in" ${delay(2 + i * 0.1)}><circle cx="${tx + 5}" cy="${ly + 30}" r="5" fill="${l.color}"/><text x="${tx + 16}" y="${ly + 34}" class="mono" font-size="12" fill="${C.muted}">${esc(label)}</text></g>`;
        tx += label.length * 7.4 + 34;
        return out;
      })
      .join("");
    langBlock = `<text x="${x0}" y="${ly - 10}" class="mono" font-size="12" fill="${C.dim}">coverage by language</text>
    <clipPath id="lbar"><rect x="${x0}" y="${ly}" width="${barW}" height="10" rx="5"/></clipPath>
    <g clip-path="url(#lbar)"><g class="lang">${segs}</g></g>${legend}`;
    ly += 56;
  } else {
    ly -= 24;
  }

  const css = `.scan{animation:scan 1.8s cubic-bezier(.4,0,.2,1) .3s both}
    @keyframes scan{from{transform:translateX(0);opacity:1}85%{opacity:1}to{transform:translateX(${gridW}px);opacity:0}}
    @media (prefers-reduced-motion: reduce){.scan{opacity:0}}
    .lang{transform-box:fill-box;transform-origin:left;animation:grow 1.2s cubic-bezier(.2,.7,.2,1) 1.9s both}
    @keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}`;
  const body = `${monthLabels.join("")}${cells}${scan}${pendingNote}${tiles}${langBlock}`;
  return frame({ w, h: ly, title: "pipeline history — contributions, last 52 weeks", body, css, label: gh ? `${gh.contributions} contributions in the last year` : "Contribution history pending first CI run" });
}

export function buttonSvg({ label, glyph, accent, primary = false }) {
  const text = `${glyph}  ${label}`;
  const w = Math.round([...text].length * 8.6) + 44, h = 44;
  const fg = primary ? "#07130e" : C.text;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<style>.g{animation:glow 2.4s ease-in-out infinite}@keyframes glow{50%{stroke-opacity:.2}}@media (prefers-reduced-motion: reduce){.g{animation:none}}</style>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="11" fill="${primary ? accent : C.bg}" stroke="${accent}" stroke-opacity=".7"/>
${primary ? `<rect class="g" x="1" y="1" width="${w - 2}" height="${h - 2}" rx="11" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="1.5"/>` : ""}
<text x="${w / 2}" y="${h / 2 + 5}" text-anchor="middle" font-family="${MONO}" font-size="14" font-weight="700" fill="${primary ? fg : accent}">${esc(text)}</text>
</svg>
`;
}
