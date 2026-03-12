const BASE_PATH = "/__commit-guard-lab";

/**
 * Render the full dashboard SPA HTML.
 * This is a self-contained single page — all CSS and JS are inlined.
 */
export function renderDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CommitGuard Lab</title>
  <style>${CSS}</style>
</head>
<body>
  <div id="app"></div>
  <script>${CLIENT_JS}</script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Inline CSS                                                        */
/* ------------------------------------------------------------------ */

const CSS = /* css */ `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace;
    background: #0a0a0a;
    color: #e0e0e0;
    min-height: 100vh;
  }

  #app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  /* Header */
  .lab-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid #1e1e1e;
    background: #0f0f0f;
  }
  .lab-header .logo {
    font-size: 0.95rem;
    font-weight: 700;
    color: #22c55e;
    text-decoration: none;
    letter-spacing: -0.02em;
  }
  .lab-header .tagline {
    font-size: 0.75rem;
    color: #555;
  }

  /* Body */
  .lab-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Sidebar */
  .lab-sidebar {
    width: 180px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0.5rem;
    border-right: 1px solid #1e1e1e;
    background: #0c0c0c;
  }
  .lab-sidebar a {
    display: block;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    color: #888;
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }
  .lab-sidebar a:hover {
    background: #161616;
    color: #bbb;
  }
  .lab-sidebar a.active {
    background: #1a1a1a;
    color: #22c55e;
  }

  /* Main */
  .lab-main {
    flex: 1;
    overflow: auto;
    padding: 1.5rem 2rem;
  }

  /* Footer */
  .lab-footer {
    padding: 0.5rem 1.5rem;
    border-top: 1px solid #1e1e1e;
    font-size: 0.7rem;
    color: #444;
    background: #0c0c0c;
  }

  /* Overview page */
  .page-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #e0e0e0;
  }
  .page-sub {
    font-size: 0.8rem;
    color: #555;
    margin-top: 0.25rem;
    margin-bottom: 1.5rem;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
  .stat-card {
    background: #141414;
    border: 1px solid #1e1e1e;
    border-radius: 8px;
    padding: 1.25rem 1rem;
    text-align: center;
  }
  .stat-card .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #22c55e;
    margin-bottom: 0.25rem;
  }
  .stat-card .label {
    font-size: 0.7rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #aaa;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #1e1e1e;
  }

  .commit-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }
  .commit-hash {
    font-size: 0.8rem;
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    color: #f59e0b;
  }
  .commit-msg {
    font-size: 0.85rem;
    color: #ccc;
  }
  .commit-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #666;
    margin-bottom: 2rem;
  }
  .commit-meta .dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #444;
    display: inline-block;
  }
  .risk-badge { color: #ef4444; font-weight: 600; }

  .action-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  .action-link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #141414;
    border: 1px solid #1e1e1e;
    border-radius: 6px;
    color: #ccc;
    text-decoration: none;
    font-size: 0.8rem;
    transition: border-color 0.15s;
  }
  .action-link:hover {
    border-color: #333;
  }
  .action-link .arrow { color: #555; }

  .loading { color: #555; font-size: 0.85rem; }
  .error { color: #ef4444; font-size: 0.85rem; }

  /* Placeholder page */
  .placeholder {
    color: #555;
    font-size: 0.85rem;
    margin-top: 1rem;
  }
`;

/* ------------------------------------------------------------------ */
/*  Inline Client JS (vanilla, no framework)                          */
/* ------------------------------------------------------------------ */

const CLIENT_JS = /* js */ `
(function() {
  const BASE = "${BASE_PATH}";

  const NAV = [
    { label: "Overview",  path: "" },
    { label: "Functions", path: "/functions" },
    { label: "Tests",     path: "/tests" },
    { label: "Changes",   path: "/changes" },
    { label: "AI Lab",    path: "/ai" },
    { label: "Debug",     path: "/debug" },
  ];

  // --- Router ---
  function currentPage() {
    const p = location.pathname;
    if (p === BASE || p === BASE + "/") return "";
    return p.replace(BASE, "");
  }

  function navigate(path) {
    history.pushState(null, "", BASE + path);
    render();
  }

  window.addEventListener("popstate", function() { render(); });

  // --- Shell ---
  function renderShell(content) {
    const page = currentPage();
    return (
      '<header class="lab-header">' +
        '<a class="logo" href="' + BASE + '" data-link>CommitGuard Lab</a>' +
        '<span class="tagline">Experimental tools for safer commits</span>' +
      '</header>' +
      '<div class="lab-body">' +
        '<nav class="lab-sidebar">' +
          NAV.map(function(n) {
            var active = n.path === "" ? page === "" : page.startsWith(n.path);
            return '<a href="' + BASE + n.path + '" data-link class="' + (active ? "active" : "") + '">' + n.label + '</a>';
          }).join("") +
        '</nav>' +
        '<main class="lab-main">' + content + '</main>' +
      '</div>' +
      '<footer class="lab-footer">commitguard v0.1.0</footer>'
    );
  }

  // --- Pages ---
  function overviewPage() {
    return (
      '<h2 class="page-title">Overview</h2>' +
      '<p class="page-sub">Project analysis summary</p>' +
      '<div class="stat-grid" id="stat-grid">' +
        statCard("--", "Functions") +
        statCard("--", "Tests") +
        statCard("--%", "Coverage") +
        statCard("--", "Avg Complexity") +
      '</div>' +
      '<div id="last-commit"></div>' +
      '<section>' +
        '<h3 class="section-title">Quick Actions</h3>' +
        '<div class="action-grid">' +
          actionLink("/functions", "Browse Functions") +
          actionLink("/tests", "View Tests") +
          actionLink("/changes", "Analyze Changes") +
          actionLink("/ai", "AI Lab") +
        '</div>' +
      '</section>'
    );
  }

  function statCard(value, label) {
    return '<div class="stat-card"><div class="value">' + value + '</div><div class="label">' + label + '</div></div>';
  }

  function actionLink(path, label) {
    return '<a class="action-link" href="' + BASE + path + '" data-link>' + label + '<span class="arrow">&rarr;</span></a>';
  }

  function placeholderPage(title) {
    return (
      '<h2 class="page-title">' + title + '</h2>' +
      '<p class="placeholder">Coming soon.</p>'
    );
  }

  // --- Render ---
  function render() {
    var page = currentPage();
    var content;

    if (page === "")             content = overviewPage();
    else if (page === "/functions" || page.startsWith("/functions/"))
                                  content = placeholderPage("Functions");
    else if (page === "/tests")   content = placeholderPage("Tests");
    else if (page === "/changes") content = placeholderPage("Changes");
    else if (page === "/ai")      content = placeholderPage("AI Lab");
    else if (page === "/debug")   content = placeholderPage("Debug");
    else                          content = placeholderPage("Not Found");

    document.getElementById("app").innerHTML = renderShell(content);
    bindLinks();

    // Load overview data if on overview page
    if (page === "") loadOverview();
  }

  function bindLinks() {
    document.querySelectorAll("[data-link]").forEach(function(a) {
      a.addEventListener("click", function(e) {
        e.preventDefault();
        var href = a.getAttribute("href");
        var path = href.replace(BASE, "") || "";
        navigate(path);
      });
    });
  }

  // --- API ---
  function loadOverview() {
    fetch(BASE + "/api/overview")
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) return;
        var grid = document.getElementById("stat-grid");
        if (grid) {
          grid.innerHTML =
            statCard(data.totalFunctions, "Functions") +
            statCard(data.totalTests, "Tests") +
            statCard(data.coverage + "%", "Coverage") +
            statCard(data.avgComplexity, "Avg Complexity");
        }
        var commitEl = document.getElementById("last-commit");
        if (commitEl && data.lastCommit) {
          var c = data.lastCommit;
          var risksHtml = c.risks > 0
            ? '<span class="risk-badge">' + c.risks + ' risks</span>'
            : 'no risks';
          commitEl.innerHTML =
            '<section style="margin-bottom:2rem">' +
              '<h3 class="section-title">Last Analyzed Commit</h3>' +
              '<div class="commit-box">' +
                '<span class="commit-hash">' + c.hash.slice(0, 7) + '</span>' +
                '<span class="commit-msg">' + (c.message || "(no message)") + '</span>' +
              '</div>' +
              '<div class="commit-meta">' +
                '<span>' + c.changedFiles + ' changed files</span>' +
                '<span class="dot"></span>' +
                '<span>' + c.changedFunctions + ' modified functions</span>' +
                '<span class="dot"></span>' +
                '<span>' + risksHtml + '</span>' +
              '</div>' +
            '</section>';
        }
      })
      .catch(function() {});
  }

  // --- Init ---
  render();
})();
`;
