# CommitGuard 프로젝트 가이드

> **프론트엔드 개발자를 위한 프로젝트 이해 문서**  
> 저장소: https://github.com/aye517/commitguard

---

## 1. 이 프로젝트는 뭔가요?

**CommitGuard**는 커밋 전에 코드 변경 사항을 분석하고, 잠재적 위험을 감지하는 도구입니다.

- **커밋 직전** 스테이징된(staged) 파일들을 분석
- **어떤 함수들이 변경됐는지** 파악
- **위험 요소**(예: 변경된 함수가 너무 많음, 커밋 메시지가 너무 짧음 등)를 감지

프론트엔드에서 "폼 유효성 검사"를 하듯, **커밋 유효성 검사**를 하는 도구라고 보면 됩니다.

---

## 2. 모노레포(Monorepo)란?

**모노레포** = 여러 개의 패키지/앱을 **한 저장소**에서 관리하는 구조입니다.

```
commitguard/           ← 하나의 Git 저장소
├── apps/              ← 실행 가능한 애플리케이션들
│   └── web            ← Next.js 대시보드
├── packages/          ← 재사용 가능한 라이브러리들
│   ├── core           ← 분석 엔진
│   ├── ai             ← AI 연동 레이어
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
| **simple-git** | Git 명령 실행 | `git diff`, `git status` 등을 코드로 호출 |
| **@babel/parser** | 코드를 AST로 파싱 | 코드를 "구조화된 트리"로 변환해 분석 |

---

## 4. 폴더 구조 상세

### 4.1 루트 (프로젝트 최상단)

| 파일 | 설명 |
|------|------|
| `package.json` | 루트 패키지. `pnpm build`, `pnpm analyze` 등 스크립트 정의 |
| `pnpm-workspace.yaml` | `apps/*`, `packages/*`를 워크스페이스로 등록 |
| `turbo.json` | Turborepo 설정. 빌드 의존성, 캐시 규칙 정의 |
| `tsconfig.json` | 공통 TypeScript 설정 |

### 4.2 apps/web (Next.js 대시보드)

- **역할**: 웹 UI로 분석 결과를 보여주는 대시보드
- **구조**: Next.js App Router (`src/app/`)
- **현재 상태**: 기본 레이아웃과 홈 페이지만 구현됨 (추가 개발 예정)

### 4.3 packages/config (설정 로더)

- **역할**: CommitGuard 동작에 필요한 설정값 관리
- **제공**: `loadConfig()` — 위험 임계값, 분석할 파일 확장자 등
- **비유**: `config.json`이나 환경 변수를 읽어서 앱에 전달하는 역할

### 4.4 packages/git (Git 유틸리티)

- **역할**: `simple-git`로 Git 작업 수행
- **제공 함수**:
  - `getDiff()` — 스테이징된 변경 사항 diff 가져오기
  - `getLastCommitMessage()` — 마지막 커밋 메시지
  - `getStagedFiles()` — 스테이징된 파일 목록
- **비유**: Git CLI를 코드에서 호출하는 래퍼(wrapper)

### 4.5 packages/core (분석 엔진) ⭐ 핵심

- **역할**: 실제 분석 로직 담당
- **제공 함수** (요구사항에 명시된 3가지):

| 함수 | 설명 |
|------|------|
| `analyzeCommit(repoPath?)` | 커밋 전체 분석. 변경 파일, 변경 함수, 위험 요소, 커밋 메시지 반환 |
| `findChangedFunctions(repoPath?)` | diff에서 변경된 파일을 파싱해, 그 안의 함수 목록 추출 |
| `detectRisk(changedFunctions, commitMessage?)` | 변경된 함수/메시지를 보고 위험 수준 판단 |

- **내부 동작**:
  1. `@commitguard/git`로 diff 가져오기
  2. `@babel/parser`로 코드를 AST(추상 구문 트리)로 파싱
  3. AST에서 함수 선언(`function`, `=>`, `const fn = function` 등) 추출
  4. 규칙에 따라 위험 감지 (예: 변경 함수 5개 초과 → medium)

### 4.6 packages/ai (AI 연동 레이어)

- **역할**: AI 테스트 생성, 위험 분석 등 AI 기능을 붙이기 위한 인터페이스
- **제공**: `AIService` 클래스 — `generateTests()`, `analyzeRisk()` 등
- **현재 상태**: 인터페이스만 정의. OpenAI, Anthropic 등 실제 AI 연동은 추후 구현

### 4.7 packages/cli (CLI 도구)

- **역할**: 터미널에서 `commitguard analyze` 실행
- **구조**: Commander로 `analyze` 서브커맨드 등록
- **동작**: `@commitguard/core`의 `analyzeCommit()` 호출 → 결과를 콘솔에 출력

---

## 5. 데이터 흐름 (CLI 기준)

```
사용자: commitguard analyze 실행
    ↓
packages/cli (Commander)
    ↓
packages/core: analyzeCommit()
    ↓
packages/git: getDiff(), getLastCommitMessage()
    ↓
packages/core: findChangedFunctions() → AST 파싱
    ↓
packages/core: detectRisk()
    ↓
결과를 CLI가 콘솔에 출력
```

---

## 6. 주요 개념 정리

### 6.1 AST (Abstract Syntax Tree, 추상 구문 트리)

- **의미**: 코드를 "구조화된 트리"로 표현한 것
- **예시**: `function foo() {}` → `{ type: 'FunctionDeclaration', id: { name: 'foo' }, ... }`
- **역할**: 문자열 검색 대신, "함수 선언", "변수 선언" 등을 정확히 찾을 수 있음
- **도구**: `@babel/parser`로 코드 → AST 변환, `@babel/traverse`로 AST 순회

### 6.2 스테이징(Staged)

- `git add`로 추가한, 아직 커밋하지 않은 변경 사항
- `git diff --cached`로 확인 가능
- CommitGuard는 **스테이징된 변경만** 분석 (이미 커밋된 건 아님)

### 6.3 pnpm workspace

- `pnpm-workspace.yaml`에 정의된 `apps/*`, `packages/*`를 하나의 워크스페이스로 취급
- 패키지 간 의존성: `"@commitguard/core": "workspace:*"` 형태로 지정
- `pnpm install` 시 워크스페이스 전체 의존성 설치

### 6.4 Turborepo

- 여러 패키지 빌드 시 **의존 순서** 자동 계산 (예: config → git → core → cli)
- **캐시**: 변경 없는 패키지는 재빌드 생략
- `turbo run build`로 전체 빌드 실행

---

## 7. 사용 방법

### 설치 및 빌드

```bash
pnpm install
pnpm build
```

### CLI 실행

```bash
# Git 저장소 루트에서
commitguard analyze

# 다른 경로 지정
commitguard analyze --path ./my-project
```

### 또는 pnpm 스크립트

```bash
pnpm analyze
```

---

## 8. 프론트엔드 개발자가 수정하기 좋은 부분

1. **apps/web** — Next.js 대시보드 UI
   - `packages/core`의 `analyzeCommit()` 결과를 API/서버에서 호출해 화면에 표시
   - React 컴포넌트로 변경 파일, 변경 함수, 위험 목록 렌더링

2. **packages/config** — 설정 UI
   - 대시보드에서 위험 임계값, 분석 대상 확장자 등을 설정할 수 있는 폼

3. **packages/cli** — 출력 포맷
   - 현재는 콘솔 텍스트. JSON 출력 옵션 추가 시, 웹에서 파싱하기 쉬움

---

## 9. 참고: 현재 구현된 위험 감지 규칙

| 조건 | 위험 수준 |
|------|----------|
| 변경된 함수 5개 초과 | medium |
| 커밋 메시지 10자 미만 | low |
| 익명 함수 존재 | low |

---

## 10. 요약

- **CommitGuard**: 커밋 전 코드 변경 분석 및 위험 감지 도구
- **모노레포**: apps(웹) + packages(라이브러리)를 한 저장소에서 관리
- **핵심 패키지**: `core`(분석), `git`(Git 연동), `cli`(터미널 명령)
- **CLI 명령**: `commitguard analyze`
- **저장소**: https://github.com/aye517/commitguard
