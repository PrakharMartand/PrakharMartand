(() => {
  const P = window.PROFILE;
  const $ = (sel, root = document) => root.querySelector(sel);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
  const NS = "http://www.w3.org/2000/svg";
  const current = P.experience.find((e) => e.current) ?? P.experience[0];
  const isPlaceholder = (url) => !url || url.includes("[");

  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "style") el.style.cssText = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
    return el;
  }

  function isDark(hex) {
    const n = parseInt(hex.slice(1), 16);
    return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 60;
  }

  function icon(item) {
    const ic = item.icon && P.icons?.[item.icon];
    let hex = item.hex || ic?.hex || "#dbe2ea";
    if (isDark(hex)) hex = "#dbe2ea";
    if (ic) {
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", ic.path);
      path.setAttribute("fill", hex);
      svg.append(path);
      return svg;
    }
    return h("span", { class: "mono-icon", style: `--c:${hex}`, "aria-hidden": "true" }, item.mono || item.name.slice(0, 2));
  }

  function link(label, url) {
    if (isPlaceholder(url)) {
      return h("a", { href: "#", class: "placeholder", title: "Not set yet: add it in profile.json", onclick: (e) => e.preventDefault() }, label);
    }
    return h("a", { href: url, target: url.startsWith("mailto:") ? null : "_blank", rel: "noopener" }, label);
  }

  // ---------------- tests ----------------
  const tests = P.suite.flatMap((g) =>
    g.tests.map((t, i) => ({ ...t, group: g.describe, indexInGroup: i, state: "idle", ran: false })),
  );
  const totalMs = tests.reduce((a, t) => a + Math.max(t.ms, 120), 0);
  let selected = null;
  let busy = false;

  const allItems = P.stack.flatMap((g) => g.items.map((item) => ({ ...item, group: g.group })));
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function itemsFor(test) {
    const title = test.title.toLowerCase();
    return allItems.filter((item) => {
      const word = item.name.toLowerCase().split(/[\s+]/)[0];
      return new RegExp(`\\b${escRe(word)}`).test(title);
    });
  }
  const kindOf = (t) =>
    t.status === "skip" ? "skip" : t.live ? "github" : t.group === "career" ? "career" : itemsFor(t).length ? "craft" : "plain";

  function renderTree(filter = "") {
    const list = $("#tests");
    list.replaceChildren();
    const q = filter.trim().toLowerCase();
    for (const g of P.suite) {
      const rows = tests.filter((t) => t.group === g.describe && (!q || `${t.group} ${t.title}`.toLowerCase().includes(q)));
      if (!rows.length) continue;
      list.append(h("li", { class: "group" }, "▾ ", g.describe));
      for (const t of rows) {
        list.append(
          h("li", {},
            h("button", { class: "test", type: "button", "data-n": t.n, "aria-current": String(selected === t), onclick: () => run(t) },
              h("span", { class: `status ${t.state}`, "aria-label": t.state }),
              h("span", {}, t.title),
              h("span", { class: "ms" }, t.ran && t.state === "pass" ? `${t.ms}ms` : ""),
            ),
          ),
        );
      }
    }
  }

  function renderLanes() {
    const lanes = $("#lanes");
    lanes.replaceChildren(
      ...tests.map((t) =>
        h("button", {
          class: `lane ${t.state === "skip" || t.state === "pending" ? t.state : ""}`,
          type: "button",
          title: `${t.n} › ${t.title}`,
          "aria-label": `Show test ${t.n}: ${t.title}`,
          "aria-current": String(selected === t),
          "data-n": t.n,
          style: `--w:${Math.max(t.ms, 120)};--fill:${t.ran ? "100%" : "0%"}`,
          onclick: () => select(t),
        }),
      ),
    );
    const ticks = $("#ticks");
    ticks.replaceChildren(...[0, 0.25, 0.5, 0.75, 1].map((f) => h("span", {}, `${((totalMs * f) / 1000).toFixed(1)}s`)));
  }

  function renderCounts() {
    const done = tests.filter((t) => t.ran);
    const pass = done.filter((t) => t.state === "pass").length;
    const skip = done.filter((t) => t.state === "skip").length;
    const pend = done.filter((t) => t.state === "pending").length;
    $("#counts").replaceChildren(
      h("b", { style: "color:var(--green)" }, `✓ ${pass}`), "  ",
      h("b", { style: "color:var(--amber)" }, `– ${skip}`), "  ",
      pend ? h("b", { style: "color:var(--muted)" }, `◌ ${pend}  `) : "",
      `/ ${tests.length}`,
    );
    $("#progress").style.width = `${(done.length / tests.length) * 100}%`;
  }

  function refresh() {
    renderTree($("#filter").value);
    renderLanes();
    renderCounts();
  }

  // ---------------- snapshot views ----------------
  function welcome() {
    $("#locator").textContent = `getByRole('heading', { name: '${P.name}' })`;
    return h("div", { class: "welcome" },
      h("div", { class: "eyebrow" }, "// system under test"),
      h("h1", {}, P.name),
      h("p", {}, P.tagline),
      h("div", { style: "display:flex;gap:10px;justify-content:center;flex-wrap:wrap" },
        h("button", { class: "btn primary", type: "button", onclick: runAll }, "▶ Run all tests"),
        h("button", { class: "btn", type: "button", onclick: () => setMode("recruiter") }, "👔 Recruiter mode"),
      ),
    );
  }

  function statTiles() {
    const g = P.github;
    if (!g) {
      return [h("p", {}, "◌ The readme.spec workflow hasn't run yet. Live GitHub numbers appear here after its first run.")];
    }
    const tiles = [
      ["contributions", g.contributions], ["longest streak", `${g.longestStreak}d`], ["current streak", `${g.currentStreak}d`],
      ["pull requests", g.pullRequests], ["public repos", g.repos], ["stars", g.stars],
    ];
    return [
      h("div", { class: "stats", "data-testid": "github-stats" },
        tiles.map(([k, v]) => h("div", { class: "stat" }, h("b", {}, typeof v === "number" ? v.toLocaleString() : v), h("span", {}, k))),
      ),
      g.languages?.length ? h("div", { class: "langbar" }, g.languages.map((l) => h("span", { style: `flex:${l.pct};background:${l.color}` }))) : "",
      g.languages?.length ? h("div", { class: "legend" }, g.languages.map((l) => h("span", {}, h("i", { style: `background:${l.color}` }), `${l.name} ${l.pct}%`))) : "",
      h("p", {}, `fetched ${P.runDate} · refreshed hourly by GitHub Actions`),
    ];
  }

  function view(t) {
    const kind = kindOf(t);
    const loc = $("#locator");
    if (kind === "career") {
      const job = P.experience[t.indexInGroup] ?? current;
      loc.textContent = `getByRole('article', { name: '${job.company}' })`;
      return h("article", { class: "card highlight" },
        h("div", { class: "eyebrow" }, job.current ? "experience · now" : "experience · previously"),
        h("h2", {}, job.role, " ", h("span", { class: "at" }, "@ "), link(job.company, job.url)),
        h("p", {}, job.note),
        h("span", { class: `badge ${job.current ? "now" : "past"}` }, job.current ? "● current role" : "○ past role"),
      );
    }
    if (kind === "craft") {
      const items = itemsFor(t);
      const groups = [...new Set(items.map((i) => i.group))];
      loc.textContent = `getByRole('list', { name: '${groups.join(" + ").toLowerCase()}' })`;
      return h("article", { class: "card highlight" },
        h("div", { class: "eyebrow" }, `stack · ${groups.join(" + ")}`),
        h("h2", {}, t.title.charAt(0).toUpperCase() + t.title.slice(1)),
        h("div", { class: "chips" }, items.map((item, i) => h("span", { class: "chip", style: `animation-delay:${i * 60}ms` }, icon(item), item.name))),
      );
    }
    if (kind === "github") {
      loc.textContent = "getByTestId('github-stats')";
      return h("article", { class: "card highlight" }, h("div", { class: "eyebrow" }, "github · live"), h("h2", {}, t.title), statTiles());
    }
    if (kind === "skip") {
      loc.textContent = "test.fixme()";
      return h("article", { class: "card" },
        h("div", { class: "eyebrow", style: "color:var(--amber)" }, "skipped"),
        h("h2", {}, t.title),
        h("p", {}, `Reason: ${t.note?.replace(/^skipped:\s*/, "") ?? "flaky"}. Root cause is under investigation. Coffee is the current workaround. ☕`),
      );
    }
    loc.textContent = `getByText('${t.title}')`;
    return h("article", { class: "card highlight" }, h("h2", {}, t.title));
  }

  // ---------------- details ----------------
  function stepDurations(t) {
    const n = t.steps.length || 1;
    return t.steps.map((_, i) => Math.round((t.ms / n) * (i === 0 ? 1.25 : 0.75)) || 0);
  }

  function renderSteps(t, activeIndex = -1) {
    const list = $("#steps");
    if (!t) {
      list.replaceChildren(h("li", { class: "empty" }, "Pick a test on the left, or press ▶ Run all."));
      return;
    }
    const durs = stepDurations(t);
    list.replaceChildren(
      ...t.steps.map((s, i) => {
        const done = t.ran && activeIndex === -1 ? true : i < activeIndex;
        const glyph = done ? (t.state === "skip" ? "–" : t.state === "pending" ? "◌" : "✓") : i === activeIndex ? "›" : "·";
        const color = done ? { skip: "var(--amber)", pending: "var(--muted)" }[t.state] ?? "var(--green)" : "var(--dim)";
        return h("li", { class: `${done ? "done" : ""} ${i === activeIndex ? "active" : ""}` },
          h("span", { style: `color:${color};font-weight:800` }, glyph),
          h("span", {}, s),
          h("span", { class: "ms" }, done && t.state === "pass" ? `${durs[i]}ms` : ""),
        );
      }),
    );
  }

  function highlight(code) {
    const frag = document.createDocumentFragment();
    const re = /('(?:[^'\\]|\\.)*')|(\/\/.*$)|\b(await|async|const|return|true|false)\b|\b(test|expect|describe|fixme)\b/gm;
    let last = 0, m;
    while ((m = re.exec(code))) {
      frag.append(code.slice(last, m.index));
      const cls = m[1] ? "s" : m[2] ? "c" : m[3] ? "k" : "f";
      frag.append(h("span", { class: cls }, m[0]));
      last = re.lastIndex;
    }
    frag.append(code.slice(last));
    return frag;
  }

  function renderSource(t) {
    const pre = $("#source");
    const q = (s) => `'${s.replace(/'/g, "\\'")}'`;
    const body = t
      ? [
          `test.describe(${q(t.group)}, () => {`,
          `  test${t.status === "skip" ? ".fixme" : ""}(${q(t.title)}, async ({ page, me }) => {`,
          ...t.steps.map((s) => `    ${s}${s.endsWith(";") ? "" : ";"}`),
          `  });`,
          `});`,
        ].join("\n")
      : `// ${P.handle.toLowerCase()}.spec.ts\n// ${tests.length} tests generated from profile.json\n// select a test to view its source`;
    pre.replaceChildren(highlight(body));
  }

  function select(t) {
    selected = t;
    $("#stage").replaceChildren(t ? view(t) : welcome());
    renderSteps(t);
    renderSource(t);
    $("#crumb").textContent = t ? `/ ${t.group} › ${t.title}` : `/ ${P.handle.toLowerCase()}.spec.ts`;
    refresh();
  }

  async function run(t, speed = 1) {
    if (t.state === "running") return;
    t.state = "running";
    t.ran = false;
    select(t);
    const durs = stepDurations(t);
    const lane = () => $(`.lane[data-n="${t.n}"]`);
    for (let i = 0; i < t.steps.length; i++) {
      renderSteps(t, i);
      lane()?.style.setProperty("--fill", `${((i + 1) / t.steps.length) * 100}%`);
      await sleep(Math.min(Math.max(durs[i] * 0.6, 220), 850) * speed);
    }
    t.state = t.status;
    t.ran = true;
    const glyph = { pass: "✓", skip: "–", pending: "◌" }[t.state];
    const cls = { pass: "ok", skip: "warn", pending: "out" }[t.state];
    print(`${glyph} ${String(t.n).padStart(2)} › ${t.group} › ${t.title}  ${t.note ? `(${t.note})` : `(${t.ms}ms)`}`, cls);
    if (selected === t) select(t);
    else refresh();
  }

  async function runAll() {
    if (busy) return;
    busy = true;
    $("#runAll").disabled = true;
    tests.forEach((t) => { t.ran = false; t.state = "idle"; });
    print(`npx playwright test ${P.handle.toLowerCase()}.spec.ts`, "in");
    print(`Running ${tests.length} tests using 4 workers`, "out");
    for (const t of tests) await run(t, 0.55);
    const pass = tests.filter((t) => t.state === "pass").length;
    const skip = tests.filter((t) => t.state === "skip").length;
    print(`${pass} passed · ${skip} skipped · 0 bugs escaped to production`, "ok");
    toast(`<b>${pass} passed</b> · ${skip} skipped. Now try the terminal, or hunt the 🐞 hidden on this page.`);
    $("#runAll").disabled = false;
    busy = false;
  }

  // ---------------- terminal ----------------
  const log = $("#log");
  function print(text, cls = "out") {
    log.append(h("div", { class: cls }, text));
    log.scrollTop = log.scrollHeight;
  }

  const commands = {
    help() {
      print(
        [
          "available commands:",
          "  whoami         who is this?",
          "  ls             list test groups",
          "  run [n|all]    run one test, or all of them",
          "  stack          print the tech stack",
          "  experience     career log",
          "  github         live GitHub stats",
          "  contact        ways to reach me",
          "  hire           open a hire request (GitHub issue form)",
          "  recruiter      switch to résumé mode",
          "  bugs           bug hunt status",
          "  clear          clear the terminal",
        ].join("\n"),
      );
    },
    whoami: () => print(`${P.name}, ${P.title} @ ${current.company}\n${P.summary}`, "info"),
    ls: () => print(P.suite.map((g) => `${g.describe}/  (${g.tests.length} tests)`).join("\n")),
    run(arg) {
      if (!arg || arg === "all") return runAll();
      const t = tests.find((x) => String(x.n) === arg);
      if (!t) return print(`no test #${arg}. there are ${tests.length}.`, "err");
      run(t);
    },
    stack: () => print(P.stack.map((g) => `${g.group.toLowerCase().padEnd(14)} ${g.items.map((i) => i.name).join(", ")}`).join("\n")),
    experience: () => print(P.experience.map((e) => `${e.current ? "●" : "○"} ${e.role} @ ${e.company}: ${e.note}`).join("\n")),
    github() {
      const g = P.github;
      if (!g) return print("◌ awaiting the first CI run.", "warn");
      print(`${g.contributions} contributions · longest streak ${g.longestStreak}d · ${g.repos} repos · ★ ${g.stars} · ${g.pullRequests} PRs`, "ok");
    },
    contact() {
      const rows = [["linkedin", P.links.linkedin], ["website", P.links.website], ["email", P.links.email], ["hire", P.links.hire]];
      print(rows.map(([k, v]) => `${k.padEnd(9)} ${isPlaceholder(v) ? "(not set yet)" : v}`).join("\n"));
    },
    hire() {
      print(`opening a hire request → ${P.links.hire}`, "ok");
      window.open(P.links.hire, "_blank", "noopener");
    },
    recruiter: () => setMode("recruiter"),
    resume: () => setMode("recruiter"),
    dev: () => setMode("dev"),
    bugs: () => print(`${caught}/${BUGS} bugs caught. hint: they hide in the panels and wiggle every few seconds.`, caught === BUGS ? "ok" : "warn"),
    clear: () => log.replaceChildren(),
    sudo: () => print("[sudo] password for visitor: ********\npermission denied: this environment is fully tested.", "err"),
    rm: () => print("blocked by pre-commit hook: no-yolo-deletes ✋", "err"),
    coffee: () => print("☕ brewing… test.fixme('sleeps 8 hours a night') remains skipped.", "warn"),
    exit: () => print("there is no exit. only more tests.", "warn"),
    echo: (...args) => print(args.join(" ")),
    date: () => print(new Date().toString()),
  };

  const cmdHistory = [];
  let hIndex = 0;
  $("#prompt").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#cmd");
    const line = input.value.trim();
    input.value = "";
    if (!line) return;
    cmdHistory.push(line);
    hIndex = cmdHistory.length;
    print(line, "in");
    const [cmd, ...args] = line.split(/\s+/);
    const fn = commands[cmd.toLowerCase()];
    if (fn) fn(...args);
    else print(`command not found: ${cmd}. try 'help'`, "err");
  });
  $("#cmd").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    hIndex = Math.max(0, Math.min(cmdHistory.length, hIndex + (e.key === "ArrowUp" ? -1 : 1)));
    e.target.value = cmdHistory[hIndex] ?? "";
  });
  $(".terminal").addEventListener("click", (e) => {
    if (!window.getSelection()?.toString() && e.target.tagName !== "A") $("#cmd").focus();
  });

  // ---------------- bug hunt ----------------
  const BUGS = 5;
  const severities = ["cosmetic", "minor", "major", "critical", "blocker"];
  let caught = 0;
  function plantBugs() {
    const hosts = [".tree", ".timeline", ".snapshot", ".details", ".terminal"];
    hosts.forEach((sel, i) => {
      const host = $(sel);
      const bug = h("button", {
        class: "bug",
        type: "button",
        "aria-label": "A bug! Catch it",
        style: `left:${10 + Math.random() * 78}%;top:${sel === ".timeline" ? 8 : 22 + Math.random() * 60}%;--d:${(Math.random() * 5).toFixed(1)}s`,
        onclick: () => {
          bug.classList.add("caught");
          caught++;
          $("#bugCount").textContent = `${caught}/${BUGS}`;
          const sev = severities[i];
          print(`🐞 bug #${caught} caught in ${sel.slice(1)} · severity: ${sev}`, "warn");
          if (caught === BUGS) {
            $("#bugmeter").classList.add("done");
            print("all bugs caught. you'd make a great SDET. let's talk: type 'hire'", "ok");
            toast(`<b>All ${BUGS} bugs caught.</b> You'd make a great SDET. Type <b>hire</b> in the terminal and let's talk.`);
          } else {
            toast(`🐞 Bug #${caught} caught · severity: <b>${sev}</b>`);
          }
        },
      }, "🐞");
      host.append(bug);
    });
    $("#bugCount").textContent = `0/${BUGS}`;
  }

  function toast(html) {
    const el = h("div", { class: "toast" });
    el.innerHTML = html;
    const box = $("#toasts");
    box.append(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => el.remove(), 5200);
  }

  // ---------------- recruiter / résumé ----------------
  function renderResume() {
    const g = P.github;
    const past = P.experience.filter((e) => !e.current);
    const role = [`${current.role} @ ${current.company}`, ...past.map((e) => `ex-${e.role} @ ${e.company}`)].join(" · ");
    $("#resume").replaceChildren(
      h("header", {},
        h("div", {},
          h("h1", {}, P.name),
          h("div", { class: "role" }, role),
          h("p", { class: "tagline" }, P.tagline),
        ),
        h("div", { class: "contact" },
          link("LinkedIn ↗", P.links.linkedin),
          link("Website ↗", P.links.website),
          link("Email ↗", P.links.email),
          link(`github.com/${P.handle} ↗`, `https://github.com/${P.handle}`),
        ),
      ),
      h("section", {}, h("h3", {}, "Summary"), h("p", { style: "margin:0" }, P.summary)),
      h("section", {}, h("h3", {}, "Experience"),
        P.experience.map((e) =>
          h("div", { class: "job" },
            h("span", { class: `pin ${e.current ? "now" : ""}` }),
            h("div", {}, h("b", {}, `${e.role}, `), link(e.company, e.url), e.current ? h("span", { style: "color:#0f7a52;font:600 12px var(--mono);margin-left:8px" }, "CURRENT") : "", h("p", {}, e.note)),
          ),
        ),
      ),
      h("section", {}, h("h3", {}, "Skills"),
        h("div", { class: "skills" }, P.stack.map((grp) => h("div", {}, h("h4", {}, grp.group), grp.items.map((i) => h("span", {}, i.name))))),
      ),
      h("section", {}, h("h3", {}, "Now exploring"), h("ul", {}, P.focus.map((f) => h("li", {}, f)))),
      g
        ? h("section", {}, h("h3", {}, `GitHub · as of ${P.runDate}`),
            h("div", { class: "gh" },
              [["contributions (1y)", g.contributions], ["longest streak", `${g.longestStreak} days`], ["public repos", g.repos], ["stars", g.stars], ["pull requests", g.pullRequests]].map(([k, v]) =>
                h("div", {}, h("b", {}, typeof v === "number" ? v.toLocaleString() : v), k),
              ),
            ),
          )
        : "",
      h("div", { class: "tools" },
        h("button", { class: "btn", type: "button", onclick: () => window.print() }, "⎙ Print / save as PDF"),
        h("a", { class: "btn", href: P.links.hire, target: "_blank", rel: "noopener" }, "+ Open a hire request"),
        h("button", { class: "btn ghost", type: "button", onclick: () => setMode("dev") }, "🧑‍💻 Back to dev mode"),
      ),
    );
  }

  function setMode(mode) {
    const recruiter = mode === "recruiter";
    $("#dev").hidden = recruiter;
    $("#recruiter").hidden = !recruiter;
    $("#runAll").hidden = recruiter;
    document.querySelectorAll(".seg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
    if (recruiter) renderResume();
    const hash = recruiter ? "#recruiter" : "";
    if (location.hash !== hash) history.replaceState(null, "", hash || location.pathname);
    document.title = recruiter ? `${P.name} · Résumé` : `${P.name} · readme.spec`;
    window.scrollTo(0, 0);
  }

  // ---------------- boot ----------------
  document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  document.querySelectorAll(".tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      $("#steps").hidden = b.dataset.tab !== "actions";
      $("#source").hidden = b.dataset.tab !== "source";
    }),
  );
  $("#runAll").addEventListener("click", runAll);
  $("#filter").addEventListener("input", (e) => renderTree(e.target.value));
  window.addEventListener("hashchange", () => setMode(location.hash === "#recruiter" ? "recruiter" : "dev"));

  select(null);
  plantBugs();
  print(`readme.spec · ${tests.length} tests loaded from profile.json`, "info");
  print("type 'help' to explore, or just watch the run.", "out");
  setMode(location.hash === "#recruiter" ? "recruiter" : "dev");
  if (location.hash !== "#recruiter") {
    if (reduced) tests.forEach((t) => { t.state = t.status; t.ran = true; }), refresh();
    else setTimeout(runAll, 900);
  }
})();
