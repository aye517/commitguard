# Project AI Context

## Project Goal

This project is a **developer tool that makes testing easy for developers who have never written tests**.

The goal is NOT to build a full testing framework.

The goal is to help developers **start testing with minimal effort** — detect functions, generate templates, recommend tests when code changes, show risk.

Think of it as a "test bootstrap tool" for people who don't test.

---

## Core Philosophy

**Most tools are for people who already test well.**

**This tool is for people who don't test.**

Target users:
- Never wrote a test
- Don't know what to test
- Find creating test files tedious
- Don't care about coverage

→ So they never use tests at all.

---

## Core Idea

Developers write code normally.

Then they run:

```bash
npx easytest init
npx easytest generate
npx easytest generate --all --filter src/utils
npx easytest check
```

Or use the **web dashboard** (`apps/web`) with a visual Generate tab — scan by path, select functions with checkboxes, and generate tests with a button click.

The tool will:

1. **init**: scan project, detect functions
2. **generate**: create simple test templates (optionally with AI edge cases). When using `--all`, path filter (`--filter`) is required if there are more than 20 functions
3. **check**: when code changes, recommend which tests to run, show risk

The focus is **developer experience** and **low friction**, not complex features.

---

## User Experience Goal

```
npx easytest init
→ Scanning project...
→ Found 42 functions

npx easytest generate
→ Generate tests? (y/n)
→ Generated: calculatePrice.test.ts, checkout.test.ts

npx easytest check
→ Changed: calculatePrice
→ Risk level: Medium
→ Affected: checkout, orderSummary
→ Recommended tests: checkout.test.ts
```

---

## Non-Goals

This project is NOT:

- a full replacement for Jest or Vitest
- a complex test framework
- a tool for "test experts"

We rely on existing frameworks (Jest, Vitest, Mocha).

Our tool only helps **generate, recommend, and bootstrap** — so beginners can start.

---

## Architecture (Keep Simple)

1. **Core** — AST, call graph, diff analyzer (already built)
2. **Test Engine** — test generator, edge case finder (AI optional)
3. **CLI** — easytest init, generate, check (with `--all`, `--filter`, `--ai`)
4. **Web Dashboard** — Check, Init, Generate tabs (apps/web)
5. **Dashboard Package** — embeddable middleware (packages/dashboard)

Use existing engines:
- Diff → changed functions → call graph → impacted functions → test recommendation
- AI: function → edge cases → test cases (optional)

---

## MVP Priority

Start very simple.

1. Scan project
2. List functions
3. Generate basic test template

```ts
describe("calculatePrice", () => {
  it("should work", () => {})
})
```

That's it. No AI required for MVP.

---

## AI Role (Optional, Later)

- Read function
- Find edge cases
- Generate test cases

Example: `calculatePrice(price, discount)` → AI suggests: price=0, discount>price, negative discount.

Core must work **without AI**.

---

## Design Priority

1. **Simplicity** — avoid over-engineering
2. **Developer experience** — feel easy, not intimidating
3. **Minimal setup** — npx and go
4. **Fast execution** — no slow scans

---

## One-Line Summary

**"테스트를 처음 쓰는 개발자를 위한 도구"**

(A tool for developers who are writing tests for the first time)
