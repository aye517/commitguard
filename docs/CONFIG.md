# CommitGuard 설정

프로젝트에 CommitGuard를 설치한 뒤, `package.json`에 설정을 추가할 수 있습니다.

## package.json

```json
{
  "name": "my-project",
  "commitguard": {
    "test": {
      "framework": "vitest",
      "outputDir": "",
      "suffix": ".test"
    },
    "ai": {
      "provider": "claude",
      "model": "claude-sonnet-4-20250514"
    },
    "risk": {
      "complexityThreshold": 10,
      "extensions": [".ts", ".tsx", ".js", ".jsx"]
    }
  }
}
```

## 옵션

### test.framework

생성되는 테스트 코드의 문법을 지정합니다.

| 값 | 설명 |
|----|------|
| `vitest` | Vitest (기본값). `import { describe, it, expect } from "vitest"` |
| `jest` | Jest. `describe`, `it`, `expect` (글로벌) |
| `mocha` | Mocha. `import { expect } from "chai"` |

### test.outputDir

테스트 파일이 들어갈 디렉터리. 소스 파일 기준 상대 경로.

- `""` (기본): 소스와 같은 디렉터리 (`foo.ts` → `foo.test.ts`)
- `"__tests__"`: 같은 디렉터리 안의 `__tests__` 폴더 (`foo.ts` → `__tests__/foo.test.ts`)

### test.suffix

테스트 파일 이름 접미사.

- `".test"` (기본): `foo.test.ts`
- `".spec"`: `foo.spec.ts`

### ai.provider

AI 프로바이더 지정. CLI `--ai` 플래그 없이도 자동으로 AI를 사용합니다.

| 값 | 설명 |
|----|------|
| `none` | AI 미사용 (기본값). 템플릿 기반 생성 |
| `claude` | Anthropic Claude API 사용 |

### ai.model

사용할 AI 모델 이름.

- 기본값: `"claude-sonnet-4-20250514"`

### ai.apiKeyEnv

API 키를 읽을 환경변수 이름.

- 기본값: `"ANTHROPIC_API_KEY"`
- 예: `"MY_CLAUDE_KEY"`로 설정하면 `process.env.MY_CLAUDE_KEY`에서 키를 읽음

### risk.complexityThreshold

Cyclomatic complexity 임계값. 이 값 이상인 함수가 변경되면 **high** 리스크로 판정됩니다.

- 기본값: `10`

### risk.extensions

분석할 소스 파일 확장자 목록.

- 기본값: `[".ts", ".tsx", ".js", ".jsx"]`

## 예시

### Vitest + AI (Claude)

```json
{
  "commitguard": {
    "test": { "framework": "vitest" },
    "ai": { "provider": "claude" }
  }
}
```

### Jest 사용 (AI 없이)

```json
{
  "commitguard": {
    "test": {
      "framework": "jest"
    }
  },
  "scripts": {
    "test": "jest"
  }
}
```

### 엄격한 complexity 임계값

```json
{
  "commitguard": {
    "risk": {
      "complexityThreshold": 5
    }
  }
}
```

### 테스트 러너가 없을 때

테스트 스크립트가 없으면 `easytest generate --run` 실행 시 설치 안내가 출력됩니다.
