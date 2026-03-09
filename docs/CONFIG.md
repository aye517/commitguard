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

## 예시

### Vitest 사용 (기본)

```json
{
  "commitguard": {
    "test": {
      "framework": "vitest"
    }
  }
}
```

### Jest 사용

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

### 테스트 러너가 없을 때

테스트 스크립트가 없으면 `commitguard generate --run` 실행 시 설치 안내가 출력됩니다.
