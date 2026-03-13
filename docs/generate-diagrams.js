#!/usr/bin/env node
/**
 * generate-diagrams.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone UML Documentation Generator — no project dependencies required.
 *
 * Analyzes the HEAD commit of a git repository and produces:
 *   • Use Case Diagram  (actors → system use cases)
 *   • Class Diagram     (domain models, interfaces, relationships)
 *
 * Both diagrams are rendered with Mermaid.js (CDN) inside a self-contained
 * HTML file you can open in any browser.
 *
 * Usage:
 *   node generate-diagrams.js [repo-path] [output-html-path]
 *
 *   repo-path        path to the git repo root   (default: cwd)
 *   output-html-path where to write the HTML file (default: diagrams.html
 *                    in the same folder as this script)
 *
 * Only built-in Node.js modules are used: child_process, fs, path.
 */

'use strict';

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

// ── Configuration ─────────────────────────────────────────────────────────────

const ARGS     = process.argv.slice(2);
const REPO_DIR = path.resolve(ARGS[0] || process.cwd());
const OUT_FILE = path.resolve(ARGS[1] || path.join(__dirname, 'diagrams.html'));

// TypeScript / React types that are NOT domain models
const UI_TYPE_PATTERN = /Props$|Config$|Options$|Event$|Ref$|Context$|Type$|Handler$|Callback$|Data$|Form$/;
const EXCLUDED_NAMES  = new Set([
  // React internals
  'FC','ReactNode','ReactElement','JSX','CSSProperties','Dispatch',
  'SetStateAction','RefObject','MutableRefObject','PropsWithChildren',
  // App-specific UI / context types
  'AuthContextType','LiveSessionContextType','WebSocketContextType',
  'LayoutProps','SidebarProps',
  // Generic / ambiguous names
  'State','Action','Store','Reducer','Context',
  // Hook return shapes (not domain models)
  'ExamSessionData',
]);

// Hard-coded domain relationships (since there is no ORM to infer them from)
const KNOWN_RELATIONS = [
  { from: 'Exam',               to: 'Question',          label: 'contains',   arrow: '-->' },
  { from: 'Exam',               to: 'ExerciseAttempt',   label: 'tracks',     arrow: '-->' },
  { from: 'ExamSubmission',     to: 'Answer',            label: 'contains',   arrow: '-->' },
  { from: 'User',               to: 'Exam',              label: 'creates',    arrow: '-->' },
  { from: 'User',               to: 'ExamSubmission',    label: 'submits',    arrow: '-->' },
  { from: 'StudentExamSession', to: 'ExerciseAttempt',   label: 'records',    arrow: '-->' },
  { from: 'AIReport',           to: 'ExerciseBreakdown', label: 'contains',   arrow: '-->' },
  { from: 'AIReport',           to: 'ScoreAttribution',  label: 'contains',   arrow: '-->' },
  { from: 'LiveSession',        to: 'User',              label: 'involves',   arrow: '-->' },
  { from: 'ExamTemplate',       to: 'Exercise',          label: 'references', arrow: '-->' },
];

// ── Git helpers ───────────────────────────────────────────────────────────────

function git(args) {
  try {
    return execSync(`git ${args}`, {
      cwd:      REPO_DIR,
      encoding: 'utf8',
      stdio:    ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

const listTrackedFiles = () => git('ls-tree -r HEAD --name-only').split('\n').filter(Boolean);
const readTrackedFile  = (p) => git(`show HEAD:${p}`);
const currentBranch    = ()  => git('rev-parse --abbrev-ref HEAD');
const shortCommit      = ()  => git('rev-parse --short HEAD');
const commitTimestamp  = ()  => git('log -1 --format=%ci HEAD');

// ── Source parsing ────────────────────────────────────────────────────────────

/** Parse TypeScript interface and type-alias declarations */
function parseTypeDefs(src) {
  const entities = [];

  // interface Foo [extends Bar, Baz] { ... }
  const ifaceRe = /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+([\w\s,<>]+?))?\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
  for (const m of src.matchAll(ifaceRe)) {
    const name = m[1];
    if (isDomainExcluded(name)) continue;
    const parents = (m[2] || '')
      .split(',')
      .map(s => s.trim().replace(/<[^>]*>/g, ''))
      .filter(Boolean);
    entities.push({ kind: 'interface', name, parents, props: parseObjectBody(m[3]), methods: [] });
  }

  // export type Foo = { ... }
  const typeRe = /(?:export\s+)?type\s+(\w+)\s*(?:<[^>]*>)?\s*=\s*\{([^}]*)\}/g;
  for (const m of src.matchAll(typeRe)) {
    const name = m[1];
    if (isDomainExcluded(name)) continue;
    entities.push({ kind: 'type', name, parents: [], props: parseObjectBody(m[2]), methods: [] });
  }

  return entities;
}

function isDomainExcluded(name) {
  return EXCLUDED_NAMES.has(name) || UI_TYPE_PATTERN.test(name);
}

function parseObjectBody(body) {
  const props = [];
  const re = /^\s*(?:readonly\s+)?(\w+)(\?)?\s*:\s*([^\n;]+)/gm;
  for (const m of body.matchAll(re)) {
    const type = m[3].trim().replace(/\/\/.*/, '').trim();
    if (/^\([^)]*\)\s*=>/.test(type)) continue; // skip function signatures
    props.push({ name: m[1], optional: !!m[2], type });
  }
  return props;
}

/** Parse TypeScript class declarations */
function parseClasses(src) {
  const classes = [];
  const re = /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:<[^>]*>)?(?:\s+extends\s+(\w+)(?:<[^>]*>)?)?(?:\s+implements\s+([\w\s,<>]+?))?\s*\{/g;
  for (const m of src.matchAll(re)) {
    const name    = m[1];
    const bodyStart = m.index + m[0].length;
    const body    = extractBlock(src, bodyStart);
    classes.push({
      kind:       'class',
      name,
      parents:    m[2] ? [m[2]] : [],
      implements: (m[3] || '').split(',').map(s => s.trim()).filter(Boolean),
      props:      parseClassProps(body),
      methods:    parseClassMethods(body),
    });
  }
  return classes;
}

function extractBlock(src, start) {
  let depth = 1, i = start;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return src.slice(start, i - 1);
}

const JS_KW = new Set([
  'if','for','while','switch','catch','do','return','new','delete',
  'typeof','void','class','const','let','var','import','export','default',
  'try','throw','async','await','yield',
]);

function parseClassProps(body) {
  const props = [];
  const re = /^\s*(?:(?:public|private|protected|readonly|static|override|declare)\s+)+(\w+)(\?)?\s*(?:[!=])?\s*:\s*([^\n;={]+)/gm;
  for (const m of body.matchAll(re)) {
    if (JS_KW.has(m[1])) continue;
    const vis = m[0].includes('private') ? '-' : '+';
    props.push({ name: m[1], optional: !!m[2], type: m[3].trim(), visibility: vis });
  }
  return props;
}

function parseClassMethods(body) {
  const methods = [];
  const seen = new Set();
  const re = /^\s*(?:(?:public|private|protected|static|async|override|abstract)\s+)*(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)\s*(?::\s*([^\n{;]+))?\s*[{;]/gm;
  for (const m of body.matchAll(re)) {
    const name = m[1];
    if (JS_KW.has(name) || name === 'constructor' || seen.has(name)) continue;
    seen.add(name);
    const vis = m[0].includes('private') ? '-' : '+';
    const ret = (m[3] || 'void').trim().replace(/\/\/.*/, '').trim();
    methods.push({ name, visibility: vis, returnType: compactType(ret) });
  }
  return methods.slice(0, 15);
}

function compactType(t) {
  return (t || 'any')
    .replace(/<[^>]*>/g, '')          // strip generics: Foo<T> → Foo
    .replace(/\|.*/g, '')             // strip union after first type: string|number → string
    .replace(/\[\]/g, 'List')         // T[] → TList (brackets break Mermaid attribute lines)
    .replace(/[^a-zA-Z0-9_]/g, '')    // remove any remaining special chars
    .slice(0, 22) || 'any';
}

// ── Route extraction ──────────────────────────────────────────────────────────

function extractRoutes(files) {
  return files
    .map(f => f.match(/src\/app\/(.+?)\/page\.[jt]sx?$/))
    .filter(Boolean)
    .map(m => {
      const seg   = m[1];
      const route = '/' + seg.replace(/\[([^\]]+)\]/g, ':$1');
      const role  = route.startsWith('/teacher') ? 'teacher'
                  : route.startsWith('/student')  ? 'student'
                  : 'public';
      const label = seg
        .split('/')
        .map(p => p.replace(/[[\]]/g, '').replace(/-/g, ' '))
        .filter(Boolean)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' / ');
      return { route, role, label };
    });
}

// ── Mermaid diagram builders ──────────────────────────────────────────────────

function nodeId(str) {
  return 'n' + str.replace(/[^a-zA-Z0-9]/g, '_');
}

function buildUseCaseDiagram(routes) {
  const teacherRoutes = routes.filter(r => r.role === 'teacher');
  const studentRoutes = routes.filter(r => r.role === 'student');
  const L = [];

  L.push('flowchart LR');
  L.push('');
  L.push('    %% ── Actors ──────────────────────────────────');
  L.push('    Teacher(["👤 Teacher"]):::actor');
  L.push('    Student(["🎓 Student"]):::actor');
  L.push('    AIGen(["🤖 AI Generator"]):::actor');
  L.push('');
  L.push('    subgraph SYS["MotiScan Platform"]');
  L.push('        direction TB');
  L.push('');
  L.push('        subgraph AUTH["Authentication"]');
  L.push('            UC_login(["Login"]):::uc');
  L.push('        end');
  L.push('');
  L.push('        subgraph TEACHER_WS["Teacher Workspace"]');
  for (const r of teacherRoutes) {
    L.push(`            ${nodeId(r.route)}(["${r.label}"]):::uc`);
  }
  L.push('        end');
  L.push('');
  L.push('        subgraph STUDENT_WS["Student Workspace"]');
  for (const r of studentRoutes) {
    L.push(`            ${nodeId(r.route)}(["${r.label}"]):::uc`);
  }
  L.push('        end');
  L.push('');
  L.push('        subgraph AI_ENGINE["AI Engine"]');
  L.push('            UC_gen(["🧠 Generate Motivation Report"]):::uc');
  L.push('            UC_calc(["📊 Calculate Dimension Scores"]):::uc');
  L.push('            UC_attr(["🔗 Attribute Scores to Exercises"]):::uc');
  L.push('        end');
  L.push('    end');
  L.push('');
  L.push('    %% ── Actor → Use Case ─────────────────────────');
  L.push('    Teacher --> UC_login');
  L.push('    Student --> UC_login');
  for (const r of teacherRoutes) L.push(`    Teacher --> ${nodeId(r.route)}`);
  for (const r of studentRoutes) L.push(`    Student --> ${nodeId(r.route)}`);
  L.push('    AIGen --> UC_gen');
  L.push('    AIGen --> UC_calc');
  L.push('    AIGen --> UC_attr');
  L.push('');
  L.push('    %% ── Include / Extend relationships ──────────');
  const rptRoute = teacherRoutes.find(r => r.route.includes('report'));
  if (rptRoute) L.push(`    ${nodeId(rptRoute.route)} -.->|include| UC_gen`);
  L.push('    UC_gen -.->|include| UC_calc');
  L.push('    UC_calc -.->|include| UC_attr');
  const examRoute = studentRoutes.find(r => r.route.includes('exam') && r.route.includes(':'));
  if (examRoute) L.push(`    ${nodeId(examRoute.route)} -.->|extend| UC_calc`);
  L.push('');
  L.push('    classDef actor fill:#1e3a5f,color:#e2e8f0,stroke:#60a5fa,stroke-width:2px');
  L.push('    classDef uc    fill:#eff6ff,color:#1e3a5f,stroke:#3b82f6,stroke-width:1.5px');

  return L.join('\n');
}

function buildClassDiagram(entities) {
  const PRIORITY = [
    'User','Exam','Question','ExamSubmission','Answer','Exercise',
    'ExerciseAttempt','StudentExamSession','MotivationReport','AIReport',
    'LiveSession','ExerciseBreakdown','ScoreAttribution','ExamTemplate',
    'DifferencesTracking','ExerciseNavigationEvent','AttributionEntry',
  ];
  const seen    = new Set();
  const ordered = [
    ...entities.filter(e => PRIORITY.includes(e.name)),
    ...entities.filter(e => !PRIORITY.includes(e.name)),
  ];
  const L = ['classDiagram'];

  for (const e of ordered) {
    if (seen.has(e.name) || EXCLUDED_NAMES.has(e.name)) continue;
    seen.add(e.name);

    L.push(`    class ${e.name} {`);
    if (e.kind === 'interface') L.push('        <<interface>>');
    else if (e.kind === 'type') L.push('        <<type>>');

    for (const p of (e.props || []).slice(0, 8)) {
      L.push(`        +${compactType(p.type)} ${p.name}`);
    }
    for (const m of (e.methods || []).slice(0, 6)) {
      L.push(`        ${m.visibility}${m.name}() ${m.returnType}`);
    }
    L.push('    }');
  }

  // Inheritance
  for (const e of ordered) {
    if (!seen.has(e.name)) continue;
    for (const parent of (e.parents || [])) {
      if (seen.has(parent) && parent !== e.name) {
        L.push(`    ${e.name} --|> ${parent} : extends`);
      }
    }
  }

  // Domain relationships
  for (const r of KNOWN_RELATIONS) {
    if (seen.has(r.from) && seen.has(r.to)) {
      L.push(`    ${r.from} ${r.arrow} ${r.to} : ${r.label}`);
    }
  }

  return L.join('\n');
}

// ── HTML builder ──────────────────────────────────────────────────────────────

function buildHTML(ucDiagram, classDiagram, meta) {
  // JSON.stringify safely encodes ALL special characters (<<, >>, newlines, etc.)
  // so the diagram sources arrive in the browser as clean JS strings — no HTML
  // encoding or DOM textContent decoding involved at all.
  const ucJSON  = JSON.stringify(ucDiagram);
  const clsJSON = JSON.stringify(classDiagram);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${meta.projectName} — UML Diagrams</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"><\/script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:      #0f172a;
      --surface: #1e293b;
      --border:  #334155;
      --accent:  #3b82f6;
      --text:    #e2e8f0;
      --muted:   #94a3b8;
      --success: #22c55e;
      --radius:  12px;
    }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: linear-gradient(135deg, #1e3a5f 0%, #1e1b4b 100%);
      border-bottom: 1px solid var(--border);
      padding: 20px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .header-title { display: flex; align-items: center; gap: 12px; }
    .header-logo {
      width: 40px; height: 40px;
      background: var(--accent);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    h1 { font-size: 1.4rem; font-weight: 700; }
    h1 span { color: var(--accent); }
    .meta-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .pill {
      background: rgba(59,130,246,.15);
      border: 1px solid rgba(59,130,246,.3);
      color: #93c5fd;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-family: 'Courier New', monospace;
    }

    .tab-bar {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      padding: 0 32px;
      gap: 4px;
    }
    .tab-btn {
      padding: 14px 24px;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      color: var(--muted);
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex; align-items: center; gap: 8px;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
    .tab-badge {
      background: rgba(59,130,246,.2);
      color: var(--accent);
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 0.7rem;
    }

    main { flex: 1; }

    /* Panels: keep both in DOM at all times (visibility swap, not display swap)
       so SVGs are never rendered inside a display:none container. */
    .diagram-panel {
      display: flex;
      flex-direction: column;
      padding: 24px 32px;
      visibility: hidden;
      height: 0;
      overflow: hidden;
    }
    .diagram-panel.active {
      visibility: visible;
      height: auto;
      overflow: visible;
    }

    .panel-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .panel-title { font-size: 1.1rem; font-weight: 600; }
    .panel-desc  { color: var(--muted); font-size: 0.82rem; margin-top: 4px; }
    .panel-actions { display: flex; gap: 8px; }
    .action-btn {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex; align-items: center; gap: 6px;
    }
    .action-btn:hover {
      background: rgba(59,130,246,.15);
      border-color: var(--accent);
      color: var(--accent);
    }

    .diagram-wrapper {
      background: #fff;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      overflow: auto;
      padding: 24px;
      min-height: 520px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    .diagram-wrapper svg { max-width: 100%; height: auto; }
    .render-placeholder {
      color: #94a3b8;
      font-size: 0.9rem;
      align-self: center;
    }
    .render-error {
      color: #ef4444;
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      white-space: pre-wrap;
      padding: 16px;
      background: #fff5f5;
      border-radius: 8px;
      border: 1px solid #fca5a5;
      width: 100%;
    }

    .source-toggle { margin-top: 12px; }
    .source-toggle summary {
      cursor: pointer;
      color: var(--muted);
      font-size: 0.78rem;
      user-select: none;
      padding: 6px 0;
    }
    .source-toggle summary:hover { color: var(--text); }
    .source-code {
      margin-top: 8px;
      background: #0d1117;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      color: #a5d6ff;
      white-space: pre;
      overflow-x: auto;
      max-height: 300px;
    }

    footer {
      background: var(--surface);
      border-top: 1px solid var(--border);
      padding: 12px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--muted);
    }
    .status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--success);
      display: inline-block;
      margin-right: 6px;
    }

    @media (max-width: 640px) {
      header, .tab-bar, .diagram-panel { padding-left: 16px; padding-right: 16px; }
    }
  </style>
</head>
<body>

  <header>
    <div class="header-title">
      <div class="header-logo">📐</div>
      <div>
        <h1><span>${meta.projectName}</span> — UML Diagrams</h1>
        <div style="color:var(--muted);font-size:.78rem;margin-top:2px">
          Auto-generated from HEAD commit · Mermaid.js
        </div>
      </div>
    </div>
    <div class="meta-pills">
      <span class="pill">🌿 ${meta.branch}</span>
      <span class="pill">🔖 ${meta.commit}</span>
      <span class="pill">📅 ${meta.date}</span>
      <span class="pill">📁 ${meta.fileCount} files</span>
    </div>
  </header>

  <div class="tab-bar">
    <button class="tab-btn active" onclick="showTab('uc')" id="tab-uc">
      👥 Use Case Diagram <span class="tab-badge">actors</span>
    </button>
    <button class="tab-btn" onclick="showTab('cls')" id="tab-cls">
      🏗️ Class Diagram <span class="tab-badge">models</span>
    </button>
  </div>

  <main>
    <div class="diagram-panel active" id="panel-uc">
      <div class="panel-header">
        <div>
          <div class="panel-title">👥 Use Case Diagram</div>
          <div class="panel-desc">
            Actors: Teacher · Student · AI Generator &nbsp;|&nbsp;
            System boundary: MotiScan Platform &nbsp;|&nbsp;
            Dashed arrows = include / extend relationships
          </div>
        </div>
        <div class="panel-actions">
          <button class="action-btn" onclick="downloadSVG('uc')">⬇ Download SVG</button>
          <button class="action-btn" onclick="copySource('uc')">📋 Copy Mermaid</button>
        </div>
      </div>
      <div class="diagram-wrapper" id="wrapper-uc">
        <span class="render-placeholder">Rendering…</span>
      </div>
      <details class="source-toggle">
        <summary>▸ Show Mermaid source</summary>
        <pre class="source-code" id="src-uc"></pre>
      </details>
    </div>

    <div class="diagram-panel" id="panel-cls">
      <div class="panel-header">
        <div>
          <div class="panel-title">🏗️ Class Diagram</div>
          <div class="panel-desc">
            Domain models extracted from TypeScript source on HEAD &nbsp;|&nbsp;
            Arrows: association, inheritance
          </div>
        </div>
        <div class="panel-actions">
          <button class="action-btn" onclick="downloadSVG('cls')">⬇ Download SVG</button>
          <button class="action-btn" onclick="copySource('cls')">📋 Copy Mermaid</button>
        </div>
      </div>
      <div class="diagram-wrapper" id="wrapper-cls">
        <span class="render-placeholder">Rendering…</span>
      </div>
      <details class="source-toggle">
        <summary>▸ Show Mermaid source</summary>
        <pre class="source-code" id="src-cls"></pre>
      </details>
    </div>
  </main>

  <footer>
    <div><span class="status-dot"></span>Rendered with Mermaid.js 10 from CDN</div>
    <div>Generated ${meta.generatedAt} &nbsp;·&nbsp; ${meta.repo}</div>
  </footer>

  <script>
    // Diagram sources embedded as JSON strings — no HTML encoding, no DOM tricks.
    var DIAGRAMS = {
      uc:  ${ucJSON},
      cls: ${clsJSON}
    };

    // Populate source-code blocks
    document.getElementById('src-uc').textContent  = DIAGRAMS.uc;
    document.getElementById('src-cls').textContent = DIAGRAMS.cls;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor:        '#eff6ff',
        primaryTextColor:    '#1e3a5f',
        primaryBorderColor:  '#3b82f6',
        lineColor:           '#3b82f6',
        secondaryColor:      '#f0fdf4',
        tertiaryColor:       '#fefce8',
        background:          '#ffffff',
        mainBkg:             '#eff6ff',
        nodeBorder:          '#3b82f6',
        clusterBkg:          '#f8fafc',
        clusterBorder:       '#cbd5e1',
        titleColor:          '#1e293b',
        edgeLabelBackground: '#f1f5f9',
        fontFamily:          'Segoe UI, system-ui, sans-serif',
        fontSize:            '14px',
      },
      flowchart:    { curve: 'basis', useMaxWidth: true },
      classDiagram: { useMaxWidth: true },
    });

    async function renderDiagram(id) {
      const wrapper = document.getElementById('wrapper-' + id);
      try {
        const { svg } = await mermaid.render('mermaid_render_' + id, DIAGRAMS[id]);
        wrapper.innerHTML = svg;
      } catch (err) {
        wrapper.innerHTML =
          '<pre class="render-error">Mermaid error:\\n' + err.message + '</pre>';
      }
    }

    document.addEventListener('DOMContentLoaded', function () {
      renderDiagram('uc');
      renderDiagram('cls');
    });

    function showTab(id) {
      document.querySelectorAll('.tab-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      document.querySelectorAll('.diagram-panel').forEach(function(p) {
        p.classList.remove('active');
      });
      document.getElementById('tab-' + id).classList.add('active');
      document.getElementById('panel-' + id).classList.add('active');
    }

    function downloadSVG(id) {
      var svg = document.querySelector('#wrapper-' + id + ' svg');
      if (!svg) return alert('Diagram not yet rendered.');
      var blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = id === 'uc' ? 'use-case-diagram.svg' : 'class-diagram.svg';
      a.click();
    }

    function copySource(id) {
      var src = DIAGRAMS[id];
      navigator.clipboard.writeText(src).then(function() {
        var btn = event.currentTarget;
        var orig = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(function() { btn.textContent = orig; }, 2000);
      });
    }
  <\/script>
</body>
</html>`;
}

function escHTML(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('');
console.log('╔══════════════════════════════════════════════════╗');
console.log('║        UML Documentation Generator               ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');
console.log(`  Repo   : ${REPO_DIR}`);
console.log(`  Output : ${OUT_FILE}`);
console.log('');

// Verify it's a git repo
const branch = currentBranch();
if (!branch) {
  console.error('✗  Not a git repository (or git not found). Aborting.');
  process.exit(1);
}
const commit = shortCommit();
const dated  = commitTimestamp();
console.log(`  Branch : ${branch}  (commit: ${commit})`);
console.log(`  Date   : ${dated}`);
console.log('');

// 1. List all files tracked on HEAD
const allFiles = listTrackedFiles();
const srcFiles = allFiles.filter(f =>
  /\.(tsx?|jsx?)$/.test(f) && !f.includes('node_modules')
);
console.log(`  ${allFiles.length} tracked files total, ${srcFiles.length} TypeScript/JS`);

// 2. Extract routes from Next.js App Router page files
const routes = extractRoutes(allFiles);
console.log('');
console.log(`  Routes detected (${routes.length}):`);
routes.forEach(r => {
  const roleTag = r.role.padEnd(7);
  console.log(`    [${roleTag}]  ${r.route}  →  "${r.label}"`);
});

// 3. Parse domain entities from types/, services/, contexts/, hooks/
const entityFiles = srcFiles.filter(f =>
  f.includes('/types/')    ||
  f.includes('/services/') ||
  f.includes('/contexts/') ||
  f.includes('/hooks/')    ||
  f.includes('/models/')   ||
  f.includes('/schemas/')
);

const rawEntities = [];
for (const f of entityFiles) {
  const content = readTrackedFile(f);
  if (!content) continue;
  rawEntities.push(...parseTypeDefs(content));
  rawEntities.push(...parseClasses(content));
}

// Deduplicate (keep first occurrence)
const entityMap = new Map();
for (const e of rawEntities) {
  if (!entityMap.has(e.name)) entityMap.set(e.name, e);
}
const entities = [...entityMap.values()];

console.log('');
console.log(`  Domain models detected (${entities.length}):`);
for (const e of entities) {
  const pCount = (e.props   || []).length;
  const mCount = (e.methods || []).length;
  console.log(`    [${e.kind.padEnd(9)}]  ${e.name.padEnd(30)}  ${pCount} props  ${mCount} methods`);
}

// 4. Generate Mermaid source
console.log('');
console.log('  Generating Mermaid diagrams...');
const ucDiagram    = buildUseCaseDiagram(routes);
const classDiagram = buildClassDiagram(entities);

// 5. Build HTML and write
const projectName = path.basename(REPO_DIR);
const html = buildHTML(ucDiagram, classDiagram, {
  projectName,
  branch,
  commit,
  date:        dated.split(' ')[0],
  generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
  repo:        REPO_DIR,
  fileCount:   srcFiles.length,
});

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, html, 'utf8');

console.log('');
console.log('╔══════════════════════════════════════════════════╗');
console.log(`║  ✓  diagrams.html written successfully           ║`);
console.log('╚══════════════════════════════════════════════════╝');
console.log('');
console.log(`  Open in browser:  file://${OUT_FILE}`);
console.log('');
