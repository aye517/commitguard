# CommitGuard 프로젝트 가이드

> **프론트엔드 개발자를 위한 프로젝트 이해 문서**  
> 저장소: https://github.com/aye517/commitguard

---

## 1. 이 프로젝트는 뭔가요?

**CommitGuard**는 Git 히스토리(또는 스테이징된 변경)를 분석하고, diff된 함수들에 대한 테스트 코드를 생성·삽입한 뒤 테스트를 실행하는 도구입니다.

- **커밋 또는 스테이징**된 변경 사항 분석
- **어떤 함수들이 변경됐는지** 파악
- **위험 요소** 감지 (변경된 함수가 너무 많음, 커밋 메시지가 짧음 등)
- **변경된 함수에 대한 테스트 코드 생성** → 프로젝트에 삽입 → **테스트 실행**

다른 개발 프로젝트에 라이브러리로 설치해서, 해당 프로젝트의 Git 히스토리를 보고 diff된 함수들의 테스트를 자동으로 만들고 돌려볼 수 있습니다.

---

## 2. 모노레포(Monorepo)란?

**모노레포** = 여러 개의 패키지/앱을 **한 저장소**에서 관리하는 구조입니다.

```
commitguard/           ← 하나의 Git 저장소
├── apps/              ← 실행 가능한 애플리케이션들
│   └── web            ← Next.js 대시보드
├── packages/          ← 재사용 가능한 라이브러리들
│   ├── core           ← 분석 엔진
│   ├── ai             ← AI 테스트 생성 + 파일 쓰기 + 테스트 실행
│   ├── git            ← Git 유틸리티
│   ├── cli            ← 터미널 CLI 도구
│   └── config         ← 설정 로더
```

**왜 모노레포?**
- `packages/core`를 `packages/cli`와 `apps/web` 둘 다에서 사용 가능
- 한 번 수정하면 여러 곳에서 반영
- 빌드/배포를 한 번에 관리 (Turborepo)

---

## 3. 사용하는 기술 스택

| 기술 | 역할 | 프론트엔드 비유 |
|------|------|-----------------|
| **pnpm** | 패키지 매니저 (npm 대체) | npm/yarn과 같은 역할 |
| **Turborepo** | 빌드 순서/캐시 관리 | Vite가 여러 페이지 빌드하듯, 여러 패키지 빌드 |
| **TypeScript** | 모든 코드에 타입 적용 | `.ts` / `.tsx` 사용 |
| **Commander** | CLI 명령어 파싱 | `commitguard analyze` 같은 명령 처리 |
| **simple-git** | Git 명령 실행 | `git diff`, `git show` 등을 코드로 호출 |
| **@babel/parser** | 코드를 AST로 파싱 | 코드를 "구조화된 트리"로 변환해 분석 |
| **Vitest** | 테스트 실행 | Jest와 유사한 테스트 러너 |

---

## 4. 폴더 구조 상세

### 4.1 루트 (프로젝트 최상단)

| 파일 | 설명 |
|------|------|
| `package.json` | 루트 패키지. `pnpm build`, `pnpm analyze`, `pnpm generate`, `pnpm test` 등 스크립트 정의 |
| `pnpm-workspace.yaml` | `apps/*`, `packages/*`를 워크스페이스로 등록 |
| `turbo.json` | Turborepo 설정. 빌드 의존성, 캐시 규칙 정의 |
| `vitest.config.ts` | Vitest 설정. 테스트 파일 경로, alias 등 |
| `tsconfig.json` | 공통 TypeScript 설정 |

### 4.2 apps/web (Next.js 대시보드)

- **역할**: 웹 UI로 분석 결과를 보여주는 대시보드
- **구조**: Next.js App Router (`src/app/`)
- **현재 상태**: 기본 레이아웃과 홈 페이지만 구현됨 (추가 개발 예정)

### 4.3 packages/config (설정 로더)

- **역할**: CommitGuard 동작에 필요한 설정값 관리
- **제공**: `loadConfig()` — 위험 임계값, 분석할 파일 확장자, **테스트 파일 경로** 등
- **테스트 설정**: `test.outputDir`, `test.suffix` — 생성되는 테스트 파일 위치/이름 규칙

### 4.4 packages/git (Git 유틸리티)

- **역할**: `simple-git`로 Git 작업 수행
- **제공 함수**:
  - `getDiff()` — 스테이징된 변경 사항 diff
  - `getDiffForCommit(commitHash)` — **특정 커밋**의 diff
  - `getCommitMessage(commitHash)` — 특정 커밋의 메시지
  - `getLastCommitMessage()` — 마지막 커밋 메시지
  - `getStagedFiles()` — 스테이징된 파일 목록

### 4.5 packages/core (분석 엔진) ⭐ 핵심

- **역할**: 실제 분석 로직 담당
- **제공 함수**:

| 함수 | 설명 |
|------|------|
| `analyzeCommit(repoPath?, options?)` | 커밋 전체 분석. `options.commit`으로 특정 커밋 지정 가능 |
| `findChangedFunctions(repoPath?, diffs?)` | diff에서 변경된 파일을 파싱해, 그 안의 함수 목록 추출 |
| `detectRisk(changedFunctions, commitMessage?)` | 변경된 함수/메시지를 보고 위험 수준 판단 |

- **내부 동작**:
  1. `@commitguard/git`로 diff 가져오기 (스테이징 또는 특정 커밋)
  2. `@babel/parser`로 코드를 AST로 파싱
  3. AST에서 함수 선언 추출
  4. 규칙에 따라 위험 감지

### 4.6 packages/ai (AI + 테스트 생성/실행)

- **역할**: 테스트 코드 생성, 프로젝트에 쓰기, 테스트 실행
- **제공 함수**:
  - `generateTestFiles(functions, repoPath?)` — 변경된 함수에 대한 테스트 파일 생성
  - `writeTestsToProject(testFiles, repoPath?)` — 프로젝트에 테스트 파일 삽입
  - `runTests(repoPath?)` — `pnpm test` 또는 `npm test` 실행
- **AIService**: `setClient()`로 OpenAI 등 AI 클라이언트 연결 가능. 미설정 시 기본 템플릿(Vitest) 생성

### 4.7 packages/cli (CLI 도구)

- **역할**: 터미널에서 `commitguard` 명령 실행
- **명령어**:
  - `analyze` — 분석 (스테이징 또는 `--commit` 지정)
  - `generate` — 테스트 생성 및 삽입 (`--run`으로 테스트 실행까지)

---

## 5. 데이터 흐름

### 5.1 analyze

```
사용자: commitguard analyze [--commit HEAD]
    ↓
packages/cli (Commander)
    ↓
packages/core: analyzeCommit(repoPath, { commit })
    ↓
packages/git: getDiff() 또는 getDiffForCommit(commit)
    ↓
packages/core: findChangedFunctions() → AST 파싱
    ↓
packages/core: detectRisk()
    ↓
결과를 CLI가 콘솔에 출력
```

### 5.2 generate (테스트 생성 + 실행)

```
사용자: commitguard generate [--commit HEAD] [--run]
    ↓
packages/core: analyzeCommit() → changedFunctions
    ↓
packages/ai: generateTestFiles() → TestFile[]
    ↓
packages/ai: writeTestsToProject() → 프로젝트에 파일 쓰기
    ↓
[--run 시] packages/ai: runTests() → pnpm test 실행
```

### 5.3 Diff 라인 → 변경 함수 매칭 (핵심 엔진)

```
git diff
    ↓
parseDiffLines() → DiffFile[] (filePath, addedLines, removedLines)
    ↓
parseASTFunctions() → findFunctionsWithRanges() → FunctionNode[] (startLine, endLine)
    ↓
detectChangedFunctions() → diff 라인이 함수 범위에 포함되면 changed
    ↓
generateTests → run tests
```

---

## 6. 주요 개념 정리

### 6.1 AST (Abstract Syntax Tree, 추상 구문 트리)

- **의미**: 코드를 "구조화된 트리"로 표현한 것
- **역할**: 문자열 검색 대신, 함수 선언 등을 정확히 찾을 수 있음
- **도구**: `@babel/parser`로 코드 → AST 변환, `@babel/traverse`로 AST 순회

### 6.2 스테이징(Staged) vs 특정 커밋

- **스테이징**: `git add`로 추가한, 아직 커밋하지 않은 변경. `getDiff()` 사용
- **특정 커밋**: `--commit HEAD` 또는 `--commit abc123` 등. `getDiffForCommit(commit)` 사용

### 6.3 테스트 파일 규칙

- 기본: 소스 파일 `src/foo.ts` → 테스트 파일 `src/foo.test.ts` (같은 디렉터리)
- config의 `test.outputDir`, `test.suffix`로 변경 가능

### 6.4 테스트 러너 지정 (package.json)

```json
{
  "commitguard": {
    "test": {
      "framework": "vitest"
    }
  }
}
```

- `vitest` (기본) | `jest` | `mocha` — 생성되는 테스트 코드 문법
- 테스트 러너가 없으면 설치 안내 메시지 출력

### 6.5 pnpm workspace

- `pnpm-workspace.yaml`에 정의된 `apps/*`, `packages/*`를 하나의 워크스페이스로 취급
- 패키지 간 의존성: `"@commitguard/core": "workspace:*"` 형태로 지정

### 6.6 Turborepo

- 여러 패키지 빌드 시 **의존 순서** 자동 계산
- **캐시**: 변경 없는 패키지는 재빌드 생략

---

## 7. 사용 방법

### 7.1 이 저장소에서 (개발/테스트)

```bash
pnpm install
pnpm build

# 분석
commitguard analyze
commitguard analyze --commit HEAD

# 테스트 생성
commitguard generate --commit HEAD

# 테스트 생성 + 실행
commitguard generate --commit HEAD --run

# 또는 pnpm 스크립트
pnpm analyze
pnpm generate
pnpm generate:run
```

### 7.2 다른 프로젝트에서 라이브러리로 사용

```bash
# 의존성 추가
pnpm add @commitguard/core @commitguard/ai @commitguard/git

# 또는 commitguard CLI를 devDependency로
pnpm add -D commitguard
```

그 다음 해당 프로젝트 루트에서:

```bash
# 특정 커밋의 diff된 함수들에 대해 테스트 생성 + 실행
commitguard generate --commit HEAD --run
```

---

## 8. Core / AI API 예시

```ts
import { analyzeCommit, findChangedFunctions, detectRisk } from "@commitguard/core";
import { generateTestFiles, writeTestsToProject, runTests } from "@commitguard/ai";

// 특정 커밋 분석
const result = await analyzeCommit("./my-project", { commit: "HEAD" });

// 테스트 생성 및 삽입
const testFiles = await generateTestFiles(result.changedFunctions, "./my-project");
const written = writeTestsToProject(testFiles, "./my-project");

// 테스트 실행
const { success, output } = runTests("./my-project");
```

---

## 9. 참고: 현재 구현된 위험 감지 규칙

| 조건 | 위험 수준 |
|------|----------|
| 변경된 함수 5개 초과 | medium |
| 커밋 메시지 10자 미만 | low |
| 익명 함수 존재 | low |

---

## 10. 요약

- **CommitGuard**: Git 히스토리/스테이징 분석 → diff된 함수 파악 → 테스트 생성 → 프로젝트에 삽입 → 테스트 실행
- **모노레포**: apps(웹) + packages(라이브러리)를 한 저장소에서 관리
- **핵심 패키지**: `core`(분석), `git`(Git 연동), `ai`(테스트 생성/실행), `cli`(터미널 명령)
- **CLI 명령**: `commitguard analyze`, `commitguard generate [--commit] [--run]`
- **저장소**: https://github.com/aye517/commitguard
