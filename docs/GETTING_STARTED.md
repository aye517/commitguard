# EasyTest 시작하기

> 테스트를 한 번도 안 써봤어도 괜찮습니다.
> 이 도구는 **"테스트 안 하는 사람"**을 위해 만들었습니다.

---

## 이 도구가 뭔가요?

코드를 작성하고 커밋하면, **어떤 함수가 바뀌었는지** 자동으로 찾아서 **테스트 파일을 만들어줍니다.**

```
코드 수정 → npx easytest generate → 테스트 파일 생성됨
```

직접 테스트 파일을 만들 필요 없습니다. 명령어 하나면 됩니다.

---

## 설치

프로젝트 폴더에서:

```bash
npm install -D commitguard
```

pnpm을 쓴다면:

```bash
pnpm add -D commitguard
```

설치 끝입니다. 별도 설정 없이 바로 사용 가능합니다.

---

## 기본 사용법 (3단계)

### 1단계: 프로젝트 스캔

```bash
npx easytest init
```

프로젝트에 어떤 함수들이 있는지 보여줍니다:

```
🔍 Scanning project...

Found 12 functions

  src/pricing.ts
    - calculatePrice (function) @ L3
    - applyDiscount (arrow) @ L15

  src/cart.ts
    - addToCart (function) @ L1
    - removeFromCart (function) @ L10

Run 'easytest generate' to create test templates.
```

### 2단계: 테스트 생성

```bash
npx easytest generate
```

변경된 함수에 대한 테스트 파일을 생성합니다. 확인 메시지가 뜹니다:

```
📝 Found 2 changed function(s).

Generate tests for these functions?
  - calculatePrice (src/pricing.ts)
  - addToCart (src/cart.ts)

(y/n) [y]:
```

엔터를 누르면 테스트 파일이 생성됩니다:

```
Created:
  + src/pricing.test.ts
  + src/cart.test.ts
```

생성된 파일을 열어보면 이런 코드가 들어있습니다:

```ts
import { describe, it, expect } from "vitest";
import { calculatePrice, applyDiscount } from "./pricing";

describe("pricing", () => {
  it("calculatePrice should work correctly", () => {
    // TODO: replace with actual arguments and expected value
    const result = calculatePrice();
    expect(result).toBeDefined();
  });

  it("applyDiscount should work correctly", () => {
    // TODO: replace with actual arguments and expected value
    const result = applyDiscount();
    expect(result).toBeDefined();
  });
});
```

`// TODO` 부분만 실제 값으로 바꾸면 테스트가 완성됩니다.

### 3단계: 테스트 실행

```bash
npx easytest generate --run
```

`--run`을 붙이면 테스트 생성 후 바로 실행까지 합니다.

---

## 자주 쓰는 명령어

| 명령어 | 설명 |
|--------|------|
| `npx easytest init` | 프로젝트 함수 목록 확인 |
| `npx easytest check` | 마지막 커밋에서 뭐가 바뀌었는지 확인 |
| `npx easytest generate` | 변경된 함수에 대한 테스트 생성 |
| `npx easytest generate --all` | 전체 함수에 대한 테스트 생성 (20개 이하일 때) |
| `npx easytest generate --all --filter src/utils` | 경로를 좁혀서 전체 테스트 생성 |
| `npx easytest generate --run` | 테스트 생성 + 실행 |
| `npx easytest generate --ai` | AI로 더 좋은 테스트 생성 |

---

## AI로 더 좋은 테스트 만들기 (선택)

기본 모드는 테스트 틀만 만들어줍니다. **AI 모드**를 쓰면 함수 코드를 읽고 edge case까지 포함된 테스트를 생성합니다.

### 사용법

1. [Anthropic Console](https://console.anthropic.com/)에서 API 키 발급
2. 환경변수 설정:

```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

3. `--ai` 붙여서 실행:

```bash
npx easytest generate --ai
```

API 키가 없으면 자동으로 기본 모드(템플릿)로 동작하므로, 에러가 나지 않습니다.

---

## check 명령어 (뭘 테스트해야 하는지 모를 때)

코드를 수정한 뒤 "뭘 테스트해야 하지?" 싶을 때:

```bash
npx easytest check
```

출력 예시:

```
📋 EasyTest Check

Changed:
  - calculatePrice (src/pricing.ts)

Affected:
  - checkout
  - orderSummary

Risk level:
  Medium

  🟡 Many functions changed (6)
  🔴 High complexity functions detected (threshold: 10)
    - calculatePrice (complexity: 14)

Recommended tests:
  - src/pricing.test.ts

Run 'easytest generate' to create or update tests.
```

**Changed**: 내가 수정한 함수
**Affected**: 내가 수정한 함수를 사용하는 다른 함수들
**Risk level**: 이 변경이 얼마나 위험한지
**Recommended tests**: 만들어야 할 테스트 파일

---

## 설정 (선택)

기본값 그대로 써도 되지만, 필요하면 `package.json`에 설정을 추가할 수 있습니다:

```json
{
  "commitguard": {
    "test": {
      "framework": "vitest",
      "suffix": ".test"
    }
  }
}
```

### 테스트 프레임워크 변경

| 값 | 설명 |
|----|------|
| `vitest` | 기본값 |
| `jest` | Jest 사용하는 프로젝트 |
| `mocha` | Mocha 사용하는 프로젝트 |

### AI를 항상 사용하려면

매번 `--ai`를 붙이기 귀찮다면:

```json
{
  "commitguard": {
    "ai": {
      "provider": "claude"
    }
  }
}
```

이렇게 하면 `npx easytest generate`만 해도 AI가 동작합니다.

자세한 설정은 [CONFIG.md](./CONFIG.md)를 참고하세요.

---

## 테스트 러너가 없을 때

프로젝트에 테스트 러너가 설치되지 않은 경우, 설치 안내가 출력됩니다:

```
테스트 러너가 없습니다. Vitest를 설치하려면:

  pnpm add -D vitest
  # package.json에 추가: "test": "vitest run"
```

안내대로 설치하면 됩니다.

---

## 함수가 많은 프로젝트에서 사용하기

`--all`로 전체 테스트를 생성할 때, 함수가 **20개를 초과**하면 `--filter`로 경로를 지정해야 합니다.

```bash
# 함수가 20개 이하면 그냥 실행됨
npx easytest generate --all

# 함수가 20개 초과 → 경로 필터 필요
npx easytest generate --all --filter src/utils
npx easytest generate --all --filter src/services
```

이렇게 하면 대규모 프로젝트에서도 범위를 좁혀서 단계적으로 테스트를 도입할 수 있습니다.

---

## 웹 대시보드로 사용하기

CLI 대신 **웹 대시보드**에서 버튼으로 테스트를 생성할 수도 있습니다.

```bash
cd apps/web
pnpm dev
```

`http://localhost:3000`에서 대시보드가 열립니다.

### 대시보드 탭

| 탭 | 설명 |
|----|------|
| **Check** | 마지막 커밋의 변경 함수 + 리스크 확인 |
| **Init (스캔)** | 프로젝트 전체 함수 목록 확인 |
| **Generate** | 경로 필터 → 함수 스캔 → 체크박스 선택 → 테스트 생성 |

### Generate 탭 사용법

1. 경로 필터에 `src/utils` 같은 경로를 입력 (선택)
2. **함수 스캔** 버튼 클릭
3. 디렉토리별로 함수 목록이 나타남
4. 체크박스로 원하는 함수만 선택
5. **테스트 생성** 버튼 클릭

CLI의 `--all --filter` 같은 제한 없이, UI에서 직접 원하는 함수만 골라서 테스트를 생성할 수 있습니다.

---

## 요약

```
npm install -D commitguard     ← 설치
npx easytest init              ← 함수 확인
npx easytest generate --run    ← 테스트 생성 + 실행
```

이 세 줄이면 됩니다.
