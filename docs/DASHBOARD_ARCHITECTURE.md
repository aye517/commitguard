# CommitGuard Lab Dashboard Architecture

This document defines the architecture, routing structure, component hierarchy, and UX flow of the **CommitGuard Lab Dashboard**.

This is the primary reference for implementing dashboard-related features. UI/UX details may change, but the core structure described here is stable.

---

## 1. Overview

CommitGuard에는 두 가지 대시보드가 존재합니다:

### 1.1 메인 대시보드 (`apps/web`)

Next.js 기반 웹 앱. `pnpm dev`로 실행하면 `http://localhost:3000`에서 접근 가능.

현재 구현된 기능:
- **Check 탭**: 커밋 분석 (변경 함수, 영향 함수, 리스크)
- **Init 탭**: 프로젝트 전체 함수 스캔 (경로 필터 지원)
- **Generate 탭**: 경로 필터 → 함수 스캔 → 디렉토리별 체크박스 선택 → 테스트 생성

API 엔드포인트:
- `GET /api/analyze` — 커밋 분석
- `GET /api/init?filter=<path>` — 함수 스캔 (경로 필터 지원)
- `POST /api/generate` — 선택한 함수에 대한 테스트 생성

### 1.2 CommitGuard Lab (`packages/dashboard`)

임베디드 개발자 대시보드. 호스트 앱에 미들웨어로 주입됩니다.

```
http://localhost:3000/__commit-guard-lab
```

CommitGuard Lab allows developers to:

- Inspect detected project functions
- View generated tests
- Analyze commit changes
- Generate edge-case tests using AI
- Visualize dependency relationships

CommitGuard Lab is a **developer tool**, not a production UI.

---

## 2. Route Architecture

CommitGuard Lab uses a dedicated route namespace:

```
/__commit-guard-lab
```

This prefix ensures:

- No collision with application routes
- Clear developer-only access
- Consistency with internal dev tool conventions

### Route Map

```
/__commit-guard-lab                        → Overview
/__commit-guard-lab/functions              → Function list
/__commit-guard-lab/functions/[functionId] → Function detail
/__commit-guard-lab/tests                  → Test list
/__commit-guard-lab/changes                → Commit change analysis
/__commit-guard-lab/ai                     → AI test generator
/__commit-guard-lab/debug                  → Internal debugging tools
```

---

## 3. App Router Structure (Next.js)

The dashboard lives inside the Next.js App Router:

```
app/
  __commit-guard-lab/
    layout.tsx                  ← Shared layout (sidebar + main panel)
    page.tsx                    ← Overview

    functions/
      page.tsx                  ← Function list
      [functionId]/
        page.tsx                ← Function detail

    tests/
      page.tsx                  ← Test list

    changes/
      page.tsx                  ← Change analysis

    ai/
      page.tsx                  ← AI test generator

    debug/
      page.tsx                  ← Debug tools
```

---

## 4. Layout Structure

CommitGuard Lab uses a fixed sidebar + scrollable main panel layout.

```
┌──────────────────────────────────────────────────────────────┐
│  Header: CommitGuard Lab                                     │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│   Sidebar    │             Main Panel                        │
│   (fixed)    │             (scrollable)                      │
│              │                                               │
│   - Overview │             Route-specific content             │
│   - Functions│                                               │
│   - Tests    │                                               │
│   - Changes  │                                               │
│   - AI       │                                               │
│   - Debug    │                                               │
│              │                                               │
├──────────────┴───────────────────────────────────────────────┤
│  Footer: version info                                        │
└──────────────────────────────────────────────────────────────┘
```

### Layout Implementation (`layout.tsx`)

```
layout.tsx renders:
  ├─ <Header />
  ├─ <div class="body">
  │    ├─ <Sidebar />
  │    └─ <MainPanel>{children}</MainPanel>
  └─ <Footer />
```

`{children}` is the route-specific page content injected by Next.js App Router.

---

## 5. Navigation

Sidebar navigation items:

```
[
  { label: "Overview",     href: "/__commit-guard-lab" },
  { label: "Functions",    href: "/__commit-guard-lab/functions" },
  { label: "Tests",        href: "/__commit-guard-lab/tests" },
  { label: "Changes",      href: "/__commit-guard-lab/changes" },
  { label: "AI Generator", href: "/__commit-guard-lab/ai" },
  { label: "Debug",        href: "/__commit-guard-lab/debug" }
]
```

Active state is determined by matching `pathname` against `href`.

---

## 6. Component Architecture

```
commit-guard-lab/
  components/

    layout/
      Sidebar.tsx               ← Navigation sidebar
      MainPanel.tsx             ← Content wrapper (scrollable area)

    overview/
      ProjectStats.tsx          ← Summary cards (functions, tests, coverage, complexity)
      RecentChanges.tsx         ← Last analyzed commit info

    functions/
      FunctionList.tsx          ← Grouped function list with search/filter
      FunctionCard.tsx          ← Single function card (name, location, status, description)
      FunctionDetail.tsx        ← Full function view (source, deps, tests, history)

    tests/
      TestList.tsx              ← Test file list with status badges
      TestViewer.tsx            ← Test code viewer + run results

    changes/
      ChangeList.tsx            ← Changed files and modified functions
      ImpactAnalysis.tsx        ← Dependency impact + suggested test updates

    ai/
      AIPromptBox.tsx           ← Function selector + prompt input
      AIResult.tsx              ← Edge case list + generated test code

    debug/
      DependencyGraph.tsx       ← Call graph visualization
      EngineLogs.tsx            ← Internal analysis logs
```

### Component Dependency Tree

```
layout.tsx
  ├─ Sidebar
  ├─ MainPanel
  │    ├─ [Overview]     → ProjectStats, RecentChanges
  │    ├─ [Functions]    → FunctionList → FunctionCard (×N)
  │    ├─ [FunctionId]   → FunctionDetail
  │    ├─ [Tests]        → TestList → TestViewer
  │    ├─ [Changes]      → ChangeList, ImpactAnalysis
  │    ├─ [AI]           → AIPromptBox, AIResult
  │    └─ [Debug]        → DependencyGraph, EngineLogs
```

---

## 7. Dashboard Pages

### Overview (`page.tsx`)

Summarizes project analysis state.

```
Functions detected: 84
Tests generated: 142
Risky functions: 3
Changed files: 7
```

Components: `ProjectStats`, `RecentChanges`

Data: `GET /api/overview`

---

### Functions (`functions/page.tsx`)

List of all detected functions, grouped by file.

```
calculatePrice()    src/cart/pricing.ts:24
checkout()          src/cart/checkout.ts:8
getUser()           src/auth/user.ts:15
```

Each entry shows: function name, file location, complexity, test status, dependencies.

Clicking a function opens **Function Detail**.

Components: `FunctionList`, `FunctionCard`

Data: `GET /api/functions`

---

### Function Detail (`functions/[functionId]/page.tsx`)

Detailed view of a single function.

Sections:

```
Function Info        ← name, location, type, complexity, AI description
Source Code          ← collapsible source viewer
Dependencies         ← calls / called-by relationships
Related Tests        ← test cases targeting this function
Change History       ← git commits that modified this function
```

Actions:

- Generate edge-case tests
- Generate boundary tests
- View/run related tests

Components: `FunctionDetail`

Data: `GET /api/functions/:id`

---

### Tests (`tests/page.tsx`)

All generated test files and their status.

Each entry shows:

- Test file name
- Target function(s)
- Generation source: `auto` / `AI` / `manual`
- Status: `PASS` / `FAIL` / `NOT RUN`

Actions:

- View test code
- Run tests
- Regenerate tests

Components: `TestList`, `TestViewer`

Data: `GET /api/tests`

---

### Changes (`changes/page.tsx`)

Commit-based change analysis. Shows the ripple effect of code changes.

Flow:

```
Commit
  ↓
Changed Files
  ↓
Modified Functions
  ↓
Impacted Dependencies
  ↓
Suggested Test Updates
```

Example:

```
Files Changed:
  checkout.ts
  price.ts

Impacted Functions:
  checkout()
  calculatePrice()

Suggested Tests:
  checkout.error.test
  calculatePrice.boundary.test
```

Components: `ChangeList`, `ImpactAnalysis`

Data: `GET /api/changes?commit=HEAD`

---

### AI Generator (`ai/page.tsx`)

AI-assisted test generation playground.

Prompt example:

```
Generate edge cases for calculatePrice()
```

Output example:

```
1. negative price
2. extremely large values
3. currency mismatch
4. zero discount edge case
```

Developers select cases and generate test files from suggestions.

Components: `AIPromptBox`, `AIResult`

Data: `POST /api/ai/edge-cases`

---

### Debug (`debug/page.tsx`)

Internal inspection tools for power users.

Features:

- Dependency graph (function call relationships)
- Engine logs (AST parsing, diff detection details)
- Risk analysis dump
- Config viewer

Example:

```
calculatePrice
  ├─ taxCalculator
  └─ currencyService
```

Components: `DependencyGraph`, `EngineLogs`

Data: `GET /api/debug/*`

---

## 8. Data Flow

The dashboard consumes data produced by the CommitGuard engine packages.

### Primary Flow

```
@commitguard/core          → functions, complexity, call graph
@commitguard/ai            → test generation, descriptions, edge cases
@commitguard/git           → diffs, commits, change history
@commitguard/config        → project configuration
        │
        ▼
  API Route Handlers
  (/__commit-guard-lab/api/*)
        │
        ▼
  Dashboard UI (React)
```

### API Layer

현재 구현된 엔드포인트 (`apps/web`):

```
GET  /api/analyze?commit=&path=&engine=   → 커밋 분석 결과
GET  /api/init?path=&filter=              → 함수 스캔 (경로 필터 지원)
POST /api/generate                        → 테스트 생성 (body: { path?, filter?, functions?, ai? })
```

현재 구현된 엔드포인트 (`packages/dashboard`):

```
GET  /__commit-guard-lab/api/overview     → ProjectStats, RecentChanges
```

계획된 엔드포인트 (미구현):

```
GET  /api/functions               → FunctionList
GET  /api/functions/:id           → FunctionDetail
GET  /api/tests                   → TestList
GET  /api/tests/:id               → TestViewer
POST /api/tests/:id/run           → Test execution
GET  /api/changes?commit=         → ChangeList, ImpactAnalysis
POST /api/ai/edge-cases           → AIResult
POST /api/ai/apply                → Write cases to test file
```

Lab API routes are relative to `/__commit-guard-lab`.

### Cache Layer

```
.commitguard/
  ├─ cache/descriptions.json     → AI function descriptions (hash-based)
  ├─ history.json                → Statistics snapshots over time
  └─ test-results.json           → Last test run results
```

---

## 9. Core UX Flow

The main developer workflow CommitGuard Lab supports:

```
Developer commits code
        ↓
Opens Changes page
        ↓
Sees impacted functions
        ↓
Navigates to Function Detail
        ↓
Generates / reviews tests
        ↓
Runs tests from dashboard
        ↓
Uses AI Lab for edge cases
```

This flow represents the **core value proposition** of CommitGuard: from code change to safe, tested commit.

---

## 10. Future Extensions

Possible advanced features:

- Interactive dependency graph visualization (node diagram)
- Risk score system with timeline
- Coverage gap detection (functions without tests)
- CI integration (auto-analyze on push, report in PR)
- Multi-project workspace dashboard

Risk score example:

```
checkout()         HIGH
calculatePrice()   MEDIUM
getUser()          LOW
```
