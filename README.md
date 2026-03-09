# CommitGuard

> 저장소: https://github.com/aye517/commitguard

Git 히스토리(또는 스테이징)를 분석하고, diff된 함수들에 대한 테스트 코드를 생성·삽입한 뒤 테스트를 실행하는 도구입니다.

다른 개발 프로젝트에 라이브러리로 설치해서, 해당 프로젝트의 커밋을 지정해 diff된 함수들의 테스트를 자동으로 만들고 돌려볼 수 있습니다.

**프론트엔드 개발자를 위한 상세 가이드**: [docs/PROJECT_GUIDE.md](./docs/PROJECT_GUIDE.md)

## Structure

```
commitguard/
├── apps/
│   └── web          # Next.js dashboard
├── packages/
│   ├── core         # Analysis engine (analyzeCommit, findChangedFunctions, detectRisk)
│   ├── ai           # AI test generation + write to project + run tests
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

# Analyze specific commit
commitguard analyze --commit HEAD
commitguard analyze --commit abc123

# Generate test files for changed functions
commitguard generate
commitguard generate --commit HEAD

# Generate and run tests
commitguard generate --commit HEAD --run

# With custom repo path
commitguard analyze --path ./my-repo
commitguard generate --path ./my-repo --commit HEAD --run
```

Or via pnpm:

```bash
pnpm analyze
pnpm generate              # generate tests
pnpm generate:run         # generate + run tests
```

## Use in Another Project

```bash
# Install as dev dependency
pnpm add -D commitguard

# package.json에 테스트 러너 지정 (선택)
# "commitguard": { "test": { "framework": "vitest" } }  // vitest | jest | mocha

# Generate tests for last commit and run them
commitguard generate --commit HEAD --run
```

설정 가이드: [docs/CONFIG.md](./docs/CONFIG.md)

Or use as library:

```bash
pnpm add @commitguard/core @commitguard/ai @commitguard/git
```

```ts
import { analyzeCommit } from "@commitguard/core";
import { generateTestFiles, writeTestsToProject, runTests } from "@commitguard/ai";

const result = await analyzeCommit("./my-project", { commit: "HEAD" });
const testFiles = await generateTestFiles(result.changedFunctions, "./my-project");
writeTestsToProject(testFiles, "./my-project");
const { success } = runTests("./my-project");
```

## Core API

```ts
import { analyzeCommit, findChangedFunctions, detectRisk } from "@commitguard/core";

// Staged or specific commit
const result = await analyzeCommit("./repo", { commit: "HEAD" });
// { changedFiles, changedFunctions, risks, commitMessage, commitHash }

const functions = await findChangedFunctions(repoPath, diffs);
const risks = detectRisk(functions, commitMessage);
```

## AI / Test API

```ts
import { generateTestFiles, writeTestsToProject, runTests } from "@commitguard/ai";

const testFiles = await generateTestFiles(changedFunctions, repoPath);
const written = writeTestsToProject(testFiles, repoPath);
const { success, output } = runTests(repoPath);
```

## Tech Stack

- **pnpm** workspace
- **Turborepo** for build orchestration
- **TypeScript** everywhere
- **Commander** for CLI
- **simple-git** for git operations
- **@babel/parser** for AST parsing
- **Vitest** for test execution
