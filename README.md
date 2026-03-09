# CommitGuard

> 저장소: https://github.com/aye517/commitguard

**테스트를 쉽게 시작하게 해주는 개발자 도구**

테스트를 한 번도 써본 적 없는 개발자도, 코드 변경 시 무엇을 테스트해야 할지 모르는 개발자도, 이 도구로 쉽게 테스트를 시작할 수 있습니다.

- **코드 변경 분석** → diff 기반 변경 함수 감지
- **영향 범위 분석** → call graph로 impacted 함수 추천
- **테스트 템플릿 생성** → 바로 실행 가능한 테스트 파일 생성

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
# 1. 프로젝트 스캔 (함수 목록 확인)
easytest init

# 2. 추천 테스트 확인 (변경된 코드 기준)
easytest check
easytest check --commit HEAD

# 3. 테스트 생성
easytest generate                    # 변경된 함수만
easytest generate --all              # 전체 함수
easytest generate --run              # 생성 후 테스트 실행
easytest generate --yes              # 확인 프롬프트 건너뛰기 (CI/스크립트)
easytest generate --commit HEAD --run
```

Or via pnpm:

```bash
pnpm init           # 프로젝트 스캔
pnpm check          # 추천 테스트 확인
pnpm generate       # 테스트 생성
pnpm generate:run   # 생성 + 실행
pnpm generate:all   # 전체 함수 대상 생성
```

`commitguard` 명령도 동일하게 사용 가능합니다 (별칭).

## Use in Another Project

```bash
# Install as dev dependency
pnpm add -D commitguard

# package.json에 테스트 러너 지정 (선택)
# "commitguard": { "test": { "framework": "vitest" } }  // vitest | jest | mocha

# Quick start
npx easytest init      # 프로젝트 스캔
npx easytest generate  # 테스트 생성
npx easytest generate --commit HEAD --run
```

설정 가이드: [docs/CONFIG.md](./docs/CONFIG.md)  
AI 플러그인: [docs/AI_PLUGIN.md](./docs/AI_PLUGIN.md)

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
