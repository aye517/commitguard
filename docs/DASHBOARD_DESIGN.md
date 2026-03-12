# CommitGuard Lab Dashboard

## Overview

CommitGuard에는 **메인 대시보드**와 **Lab 대시보드** 두 가지가 존재합니다.

### 메인 대시보드 (`apps/web` — 현재 구현됨)

`http://localhost:3000`에서 접근. 3개 탭으로 구성:

- **Check**: 커밋 기반 변경 분석 (변경 함수, 영향 함수, 리스크)
- **Init (스캔)**: 프로젝트 전체 함수 스캔
- **Generate**: 경로 필터 → 함수 스캔 → 디렉토리별 트리 뷰 → 체크박스로 선택 → 테스트 생성

Generate 탭은 CLI의 `easytest generate --all --filter`를 UI로 대체하며, CLI의 20개 제한 없이 사용자가 직접 함수를 골라서 생성할 수 있습니다.

### CommitGuard Lab (`packages/dashboard` — 개발 중)

`http://localhost:3000/__commit-guard-lab`에서 접근.

호스트 앱에 미들웨어로 주입되는 임베디드 대시보드입니다.

CommitGuard Lab provides a visual environment where developers can:

- Inspect generated tests
- Analyze code changes and function dependencies
- View project-wide statistics
- Ask AI to generate additional edge-case tests

---

## Design Philosophy

CommitGuard Lab is designed as an **experimental developer playground**, not a production UI.

Inspirations: Storybook-style dev environments, internal debugging consoles.

Key principles:

- **Zero setup** after `init` -- automatically available
- **Minimal styling** -- code-focused, fast navigation
- **Laboratory feel** -- experimental and powerful, not corporate
- **Developer-friendly language** -- terse, technical tone

Header example:

```
CommitGuard Lab
Experimental tools for safer commits.
```

---

## Route Convention

```
/__commit-guard-lab              → Dashboard home (Overview)
/__commit-guard-lab/functions    → Functions list & detail
/__commit-guard-lab/tests        → Tests list & detail
/__commit-guard-lab/changes      → Commit-based change analysis
/__commit-guard-lab/ai           → AI Test Generator
/__commit-guard-lab/debug        → (optional) Internal analysis data
```

Why `/__commit-guard-lab`:

1. Double underscore prefix prevents collision with application routes
2. Signals this is an internal developer tool
3. Follows conventions of framework-injected dev tools

---

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  CommitGuard Lab                  Experimental tools for     │
│                                   safer commits.             │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│  Overview    │                                               │
│              │              Main Content Area                 │
│  Functions   │                                               │
│              │                                               │
│  Tests       │                                               │
│              │                                               │
│  Changes     │                                               │
│              │                                               │
│  AI Lab      │                                               │
│              │                                               │
├──────────────┴───────────────────────────────────────────────┤
│  commitguard v0.x.x                                          │
└──────────────────────────────────────────────────────────────┘
```

- **Left**: Fixed sidebar navigation (5 sections)
- **Right**: Content area for the selected section

---

## Section 1: Overview (`/__commit-guard-lab`)

High-level summary of the current project state.

```
┌──────────────────────────────────────────────────────────────┐
│  Project Overview                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐│
│  │    142     │  │     87    │  │   61.3%   │  │    3.2    ││
│  │  Functions │  │   Tests   │  │  Coverage │  │ Avg Cmplx ││
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘│
│                                                              │
│  Last Analyzed Commit                                        │
│  ──────────────────────                                      │
│  a8c9818  feat: AI 테스트 생성(Claude), cyclomatic ...       │
│  3 changed files · 5 modified functions · 2 risks detected   │
│                                                              │
│  Risky Functions                                             │
│  ──────────────────────                                      │
│  ⚠ parseComplexInput   src/parser.ts:45   complexity: 14     │
│  ⚠ handleEdgeCases     src/handler.ts:92  complexity: 11     │
│                                                              │
│  Recent Activity                                             │
│  ──────────────────────                                      │
│  · 3 tests generated (2h ago)                                │
│  · 1 edge case added via AI (5h ago)                         │
│  · Project scanned: 142 functions found (1d ago)             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Summary Cards**:

| Card | Data Source |
|------|------------|
| Functions | `listProjectFunctions()` count |
| Tests | Test directory scan (`**/*.test.{ts,js}`) |
| Coverage | (functions with tests / total functions) x 100 |
| Avg Complexity | `analyzeFunctionComplexity()` average |

**Last Analyzed Commit**: Most recent `analyzeCommit()` result -- changed files, modified functions, risk count.

**Risky Functions**: Functions exceeding the complexity threshold from config.

---

## Section 2: Functions (`/__commit-guard-lab/functions`)

All detected functions in the project. Each function is a first-class entity.

### 2-1. Function List

```
┌──────────────────────────────────────────────────────────────┐
│  Functions                              Search: [________]   │
│                                                              │
│  Filter: [All ▾]  Sort: [File ▾]                 142 total   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  src/cart/pricing.ts                                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  calculateTotal          arrow   L24   Complexity: 6   │  │
│  │  ──────────────────────────────────────────────────── │  │
│  │  장바구니 아이템의 가격 합계를 계산. 할인율과 세금을      │  │
│  │  적용한 최종 금액을 반환한다.                            │  │
│  │                                                        │  │
│  │  Tests: 2 cases  PASS        Dependencies: 3           │  │
│  │                                         [Detail →]     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  applyDiscount           function  L52  Complexity: 3  │  │
│  │  ──────────────────────────────────────────────────── │  │
│  │  단일 아이템에 대한 할인 적용 유틸리티.                   │  │
│  │                                                        │  │
│  │  Tests: 1 case   PASS        Dependencies: 1           │  │
│  │                                         [Detail →]     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  src/auth/validator.ts                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  validateEmail           arrow   L12   Complexity: 4   │  │
│  │  ──────────────────────────────────────────────────── │  │
│  │  이메일 형식 유효성을 검증. RFC 5322 기반 정규식 사용.   │  │
│  │                                                        │  │
│  │  Tests: NOT RUN                  Dependencies: 0       │  │
│  │                                         [Detail →]     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Each function card shows**:

| Field | Description |
|-------|------------|
| Name | Function name (`calculateTotal`) |
| Type | `function` / `arrow` / `method` |
| Location | File path + line number |
| Complexity | Cyclomatic complexity score |
| AI Description | 1-2 line summary generated by AI (cached) |
| Test Status | `PASS` / `FAIL` / `NOT RUN` badge |
| Dependencies | Count of functions this calls or is called by |

**Filters & Sort**:

- Group by file path (directory tree, default)
- Filter by test status: All / PASS / FAIL / NOT RUN
- Sort by: file, complexity (desc), name
- Search by function name or file path

### 2-2. Function Detail (`/__commit-guard-lab/functions/:id`)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back    calculateTotal                                    │
│            src/cart/pricing.ts:24       arrow   Complexity: 6│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Description                                                 │
│  ─────────────────────                                       │
│  장바구니 아이템의 가격 합계를 계산합니다.                       │
│  할인율(discountRate)과 세금(taxRate)을 적용하여                │
│  최종 금액을 반환합니다.                                       │
│                                                              │
│  Params: items: CartItem[], discountRate: number              │
│  Returns: number                                             │
│                                                              │
│  Source Code                                        [Expand] │
│  ─────────────────────                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ const calculateTotal = (items, discountRate) => {      │  │
│  │   const subtotal = items.reduce((s, i) => ...);        │  │
│  │   return subtotal * (1 - discountRate);                │  │
│  │ };                                                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Dependencies                                                │
│  ─────────────────────                                       │
│  Calls:      applyDiscount, formatCurrency                   │
│  Called by:  checkout, renderCart                             │
│                                                              │
│  Related Tests                                    [View All] │
│  ─────────────────────                                       │
│  ✅ calculateTotal should return 0 for empty array           │
│  ✅ calculateTotal should apply discount correctly            │
│  ❌ calculateTotal should handle negative prices              │
│                                                              │
│  Change History                                              │
│  ─────────────────────                                       │
│  a8c9818  refactor: simplify discount calc       (2d ago)    │
│  f92bc44  feat: add tax rate parameter           (5d ago)    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Detail page features**:

| Feature | Description |
|---------|------------|
| AI Description | Auto-generated summary of what the function does |
| Source Code | Collapsible source code viewer with syntax highlighting |
| Dependencies | Call graph -- what this function calls, and what calls it |
| Related Tests | List of test cases targeting this function, with pass/fail status |
| Change History | Git log entries where this function was modified |

**Actions available**:

- View full source code
- Navigate to related tests
- Generate tests for this function
- Ask AI about edge cases

---

## Section 3: Tests (`/__commit-guard-lab/tests`)

All generated test files and their status.

### 3-1. Test List

```
┌──────────────────────────────────────────────────────────────┐
│  Tests                                   Search: [________]  │
│                                                              │
│  Filter: [All ▾]  Source: [All ▾]                  87 total  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  pricing.test.ts                                       │  │
│  │  Target: calculateTotal, applyDiscount                 │  │
│  │  Source: AI Generated        Cases: 5       PASS       │  │
│  │                                          [Detail →]    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  validator.test.ts                                     │  │
│  │  Target: validateEmail                                 │  │
│  │  Source: Template            Cases: 1       NOT RUN    │  │
│  │                                          [Detail →]    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  handler.test.ts                                       │  │
│  │  Target: handleRequest, parseBody                      │  │
│  │  Source: AI Generated        Cases: 8       FAIL       │  │
│  │                                          [Detail →]    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Each test card shows**:

| Field | Description |
|-------|------------|
| Test File | File name (`pricing.test.ts`) |
| Target Functions | Which functions this test covers |
| Generation Source | `AI Generated` / `Template` / `Manual` |
| Case Count | Number of `it()` blocks |
| Status | `PASS` / `FAIL` / `NOT RUN` |

**Filters**:

- Status: All / PASS / FAIL / NOT RUN
- Source: All / AI Generated / Template / Manual

### 3-2. Test Detail (`/__commit-guard-lab/tests/:id`)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back    pricing.test.ts                        [▶ Run]   │
│            Target: calculateTotal, applyDiscount             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Test Code                                                   │
│  ─────────────────────                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ import { describe, it, expect } from "vitest";         │  │
│  │ import { calculateTotal } from "../src/cart/pricing";  │  │
│  │                                                        │  │
│  │ describe('calculateTotal', () => {                     │  │
│  │   it('returns 0 for empty array', () => {              │  │
│  │     expect(calculateTotal([], 0)).toBe(0);             │  │
│  │   });                                                  │  │
│  │                                                        │  │
│  │   it('applies discount correctly', () => {             │  │
│  │     const items = [{ price: 100, qty: 2 }];            │  │
│  │     expect(calculateTotal(items, 0.1)).toBe(180);      │  │
│  │   });                                                  │  │
│  │ });                                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Run Results                                                 │
│  ─────────────────────                                       │
│  ✅ returns 0 for empty array                      0.8ms     │
│  ✅ applies discount correctly                     1.2ms     │
│  ❌ handles negative prices                        2.1ms     │
│     AssertionError: expected -100 to be 0                    │
│                                                              │
│  Coverage Info                                               │
│  ─────────────────────                                       │
│  calculateTotal: 3/5 branches covered                        │
│  applyDiscount:  2/2 branches covered                        │
│                                                              │
│  Actions                                                     │
│  ─────────────────────                                       │
│  [▶ Run Tests]  [🔄 Regenerate]  [🤖 Add Edge Cases]        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Test detail features**:

| Feature | Description |
|---------|------------|
| Code Viewer | Full test source code with syntax highlighting |
| Run Tests | Execute this test file only (`vitest run --testPathPattern ...`) |
| Run Results | Per-`it` block: pass/fail, duration, error message if failed |
| Coverage | Branch coverage per target function (if available) |
| Regenerate | Re-generate the test file via AI or template |
| Add Edge Cases | Jump to AI Lab with this function pre-selected |

---

## Section 4: Changes (`/__commit-guard-lab/changes`)

Commit-based change analysis. Helps developers understand **what tests should be updated when code changes**.

```
┌──────────────────────────────────────────────────────────────┐
│  Changes                                                     │
│                                                              │
│  Commit: [HEAD              ▾]   [Analyze]                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Commit: a8c9818                                             │
│  Message: feat: AI 테스트 생성(Claude), cyclomatic complexity │
│                                                              │
│  Changed Files (3)                                           │
│  ─────────────────────                                       │
│  M  src/cart/pricing.ts                                      │
│  M  src/auth/validator.ts                                    │
│  A  src/utils/format.ts                                      │
│                                                              │
│  Modified Functions (5)                                      │
│  ─────────────────────                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  calculateTotal    src/cart/pricing.ts:24    ⚠ High    │  │
│  │  applyDiscount     src/cart/pricing.ts:52    ○ Low     │  │
│  │  validateEmail     src/auth/validator.ts:12  ○ Low     │  │
│  │  formatCurrency    src/utils/format.ts:8     ○ Low     │  │
│  │  parseMoney        src/utils/format.ts:22    △ Medium  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Impacted Dependencies (3)                                   │
│  ─────────────────────                                       │
│  checkout        ← calls calculateTotal (changed)            │
│  renderCart      ← calls calculateTotal (changed)            │
│  formatInvoice   ← calls formatCurrency (changed)            │
│                                                              │
│  Suggested Test Updates                                      │
│  ─────────────────────                                       │
│  ⚠ pricing.test.ts — target function modified                │
│  ⚠ checkout.test.ts — dependency changed (calculateTotal)    │
│  + format.test.ts — new functions, no tests yet              │
│                  [Generate Missing Tests]                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Data sources**:

| Section | Source |
|---------|--------|
| Changed Files | `analyzeCommit()` → `changedFiles` |
| Modified Functions | `analyzeCommit()` → `changedFunctions` + `detectRisk()` |
| Impacted Dependencies | `findImpactedFunctions()` via call graph |
| Suggested Test Updates | Cross-reference modified/impacted functions with existing test files |

**Key value**: Shows developers the **ripple effect** of code changes -- not just what changed, but what else might break.

---

## Section 5: AI Lab (`/__commit-guard-lab/ai`)

AI-assisted test generation playground.

```
┌──────────────────────────────────────────────────────────────┐
│  AI Lab                                                      │
│  Ask AI to generate edge-case tests for your functions.      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Select Function                                             │
│  ─────────────────────                                       │
│  [calculateTotal          ▾]   src/cart/pricing.ts:24        │
│                                                              │
│  Quick Actions                                               │
│  ─────────────────────                                       │
│  [Generate edge cases]                                       │
│  [Find boundary conditions]                                  │
│  [What inputs could break this?]                             │
│                                                              │
│  Or ask a custom question:                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                             [Ask AI]         │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  AI Response                                                 │
│  ─────────────────────                                       │
│  Based on the source code of `calculateTotal`, here are      │
│  edge cases you should test:                                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  □ Negative price items — should clamp to 0 or throw   │  │
│  │  □ Discount rate > 1.0 — results in negative total     │  │
│  │  □ Discount rate < 0 — surcharge scenario              │  │
│  │  □ Floating point precision — 0.1 + 0.2 !== 0.3       │  │
│  │  □ Very large quantities — Number.MAX_SAFE_INTEGER     │  │
│  │  □ Empty item objects — missing price/qty fields       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Generated Test Code                                         │
│  ─────────────────────                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ it('handles negative prices', () => {                  │  │
│  │   const items = [{ price: -50, qty: 1 }];              │  │
│  │   expect(calculateTotal(items, 0)).toBe(0);            │  │
│  │ });                                                    │  │
│  │                                                        │  │
│  │ it('handles discount > 100%', () => {                  │  │
│  │   const items = [{ price: 100, qty: 1 }];              │  │
│  │   expect(calculateTotal(items, 1.5)).toBe(-50);        │  │
│  │ });                                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [Add Selected to Test File]  [Add All]  [Copy to Clipboard] │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Features**:

| Feature | Description |
|---------|------------|
| Function Selector | Dropdown of all project functions |
| Quick Actions | Pre-built prompts: edge cases, boundary conditions, breaking inputs |
| Custom Question | Free-text input to ask AI anything about the selected function |
| AI Response | Structured list of suggested edge cases with checkboxes |
| Generated Code | Actual test code for each suggested case |
| Apply Actions | Add selected cases to existing test file, add all, or copy |

**AI prompt examples**:

- "Generate edge cases for this function"
- "What inputs could break this logic?"
- "Create boundary condition tests"
- "Find null/undefined handling gaps"
- "Test concurrent access scenarios"

---

## Debug Page (Optional) (`/__commit-guard-lab/debug`)

Exposes internal analysis data for power users.

| Section | Data |
|---------|------|
| Dependency Graph | Full call graph visualization (caller → callee) |
| Function Relationships | Which functions reference which |
| Change Impact | Transitive impact analysis from `findImpactedFunctions()` |
| Engine Logs | AST parsing results, diff detection details |
| Config Dump | Current resolved configuration |

---

## Technical Architecture

### Middleware Injection

After `commit-guard init`, the dashboard is injected into the host application as middleware/plugin.

```
Host Application Server
  ├─ /                          → Application (unchanged)
  ├─ /api/*                     → Application API (unchanged)
  └─ /__commit-guard-lab/*      → CommitGuard Lab (injected)
```

**Framework integration**:

| Framework | Integration Method |
|-----------|-------------------|
| Next.js | `middleware.ts` route matching → serve bundled SPA |
| Express | `app.use('/__commit-guard-lab', commitguardLab())` |
| Vite | Plugin in `vite.config.ts` |
| Standalone | `npx easytest lab` → self-hosted server (port 4820) |

### Build Strategy

- SPA (Single Page Application) built with React + Vite
- Build output bundled into the npm package as static assets
- Middleware serves bundled HTML/JS/CSS for dashboard routes
- API requests handled within the same middleware (`/__commit-guard-lab/api/*`)

### Package Location

```
packages/dashboard/        → New package: @commitguard/dashboard
  ├── src/
  │   ├── client/          → React SPA source
  │   ├── server/          → Middleware + API handlers
  │   └── index.ts         → Main export (middleware factory)
  └── dist/
      ├── client/          → Bundled SPA assets
      └── server/          → Compiled middleware
```

### API Endpoints

```
GET  /__commit-guard-lab/api/overview
     → Summary cards + last commit + risky functions

GET  /__commit-guard-lab/api/functions
     → All functions with metadata, AI descriptions, test status

GET  /__commit-guard-lab/api/functions/:id
     → Function detail: source, dependencies, tests, history

GET  /__commit-guard-lab/api/tests
     → All test files with status and target functions

GET  /__commit-guard-lab/api/tests/:id
     → Test detail: code, last run results, coverage

POST /__commit-guard-lab/api/tests/:id/run
     → Execute test file, return per-case results

POST /__commit-guard-lab/api/tests/:id/regenerate
     → Re-generate test via AI or template

GET  /__commit-guard-lab/api/changes?commit=HEAD
     → Commit analysis: changed files, functions, impacts, suggestions

POST /__commit-guard-lab/api/ai/edge-cases
     → Body: { functionId, prompt? } → AI edge case generation

POST /__commit-guard-lab/api/ai/apply
     → Body: { functionId, cases[] } → Append cases to test file

GET  /__commit-guard-lab/api/stats
     → Project statistics (function count, test count, complexity)

GET  /__commit-guard-lab/api/stats/history
     → Historical trend data (snapshots over time)
```

### Data Flow

```
[CommitGuard Lab SPA]
       │
       │  fetch(/__commit-guard-lab/api/*)
       ▼
[Middleware / API Handler]
       │
       ├─ @commitguard/core     → listProjectFunctions(), analyzeCommit(),
       │                          analyzeFunctionComplexity(), buildCallGraph()
       │
       ├─ @commitguard/ai       → generateTestFiles(), AIService,
       │                          ClaudeClient (edge case generation)
       │
       ├─ @commitguard/git      → getDiff(), getDiffForCommit(),
       │                          getCommitMessage(), parseDiffLines()
       │
       └─ @commitguard/config   → loadConfigFromProject()
```

---

## Local Data Storage

```
.commitguard/                          (project root, gitignored)
  ├── cache/
  │   └── descriptions.json            AI-generated function descriptions
  ├── history.json                     Statistics snapshots (date → counts)
  └── test-results.json                Last test run results cache
```

| File | Purpose | Invalidation |
|------|---------|-------------|
| `descriptions.json` | Function hash → AI description map | Re-generate when function content changes |
| `history.json` | Trend chart data source | Appended by `easytest snapshot` or CI hook |
| `test-results.json` | PASS/FAIL badges in list views | Updated on every test run |

---

## Implementation Priority

| Phase | Scope | Details |
|-------|-------|---------|
| **P0** | Middleware + SPA shell | Route injection, sidebar layout, client-side routing |
| **P0** | Overview page | Summary cards, last commit info |
| **P0** | Functions list + API | `GET /api/functions`, grouped card list |
| **P1** | Function detail | Source viewer, dependency list, related tests |
| **P1** | Tests list + detail | Test file list, code viewer, run button |
| **P1** | AI descriptions + cache | Auto-generate on first load, cache in `.commitguard/` |
| **P2** | Changes page | Commit analysis, impact graph, test suggestions |
| **P2** | AI Lab | Function selector, quick actions, edge case generation |
| **P2** | Test execution | Run single test file, display per-case results |
| **P3** | Debug page | Call graph dump, engine logs, config viewer |
| **P3** | Standalone mode | `npx easytest lab` CLI command |
| **P3** | History snapshots | `easytest snapshot` command, trend charts |

---

## Tech Stack (Dashboard Package)

| Concern | Choice | Reason |
|---------|--------|--------|
| SPA Framework | React | Consistent with existing `apps/web` |
| Bundler | Vite | Fast builds, small output |
| Styling | CSS Modules or vanilla CSS | Minimize bundle size, no external deps |
| Code Highlighting | `shiki` or `prism-react-renderer` | Syntax highlighting for source/test viewers |
| Charts | Lightweight SVG or `recharts` | Trend charts in Overview / Stats |
| Routing | Client-side hash router | No server routing needed, works in SPA |

---

## Future Extensions

- Visual function call graph (interactive node diagram)
- Commit risk scoring timeline
- Automatic test coverage gap detection
- CI integration: auto-run analysis on push, report in PR
- Multi-project support (workspace-wide dashboard)
