# CommitGuard

> 저장소: https://github.com/aye517/commitguard

TypeScript monorepo for commit analysis and risk detection.

**프론트엔드 개발자를 위한 상세 가이드**: [docs/PROJECT_GUIDE.md](./docs/PROJECT_GUIDE.md)

## Structure

```
commitguard/
├── apps/
│   └── web          # Next.js dashboard
├── packages/
│   ├── core         # Analysis engine (analyzeCommit, findChangedFunctions, detectRisk)
│   ├── ai           # AI test generation layer
│   ├── git          # Git utilities (simple-git)
│   ├── cli          # Devtool CLI (commander)
│   └── config       # Config loader
```

## Setup

```bash
pnpm install
pnpm build
```

## CLI

```bash
# Analyze staged changes
commitguard analyze

# With custom repo path
commitguard analyze --path ./my-repo
```

Or via pnpm:

```bash
pnpm analyze
```

## Core API

```ts
import { analyzeCommit, findChangedFunctions, detectRisk } from "@commitguard/core";

const result = await analyzeCommit();
// { changedFiles, changedFunctions, risks, commitMessage }

const functions = await findChangedFunctions(repoPath);
const risks = detectRisk(functions, commitMessage);
```

## Tech Stack

- **pnpm** workspace
- **Turborepo** for build orchestration
- **TypeScript** everywhere
- **Commander** for CLI
- **simple-git** for git operations
- **@babel/parser** for AST parsing
