# AI 플러그인 가이드

EasyTest는 기본적으로 **소스 코드를 import하는 템플릿 기반 테스트**를 생성합니다. AI를 사용하면 **edge case까지 포함된 고품질 테스트**를 자동 생성할 수 있습니다.

## 빌트인 Claude 지원

### 1. CLI에서 바로 사용

```bash
# API 키 설정
export ANTHROPIC_API_KEY=sk-ant-...

# AI로 테스트 생성
npx easytest generate --ai

# 전체 함수 대상 + AI + 실행
npx easytest generate --all --ai --run
```

### 2. package.json에 설정 (항상 AI 사용)

```json
{
  "commitguard": {
    "ai": {
      "provider": "claude",
      "model": "claude-sonnet-4-20250514"
    }
  }
}
```

### 3. 환경변수 오버라이드

| 환경변수 | 설명 |
|---------|------|
| `ANTHROPIC_API_KEY` | Anthropic API 키 (필수) |
| `COMMITGUARD_AI_PROVIDER` | 프로바이더 오버라이드 (`claude` \| `none`) |

API 키가 없으면 자동으로 템플릿 모드로 폴백됩니다.

## AI 설정 옵션

`package.json`의 `commitguard.ai` 필드:

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `provider` | `"none"` | AI 프로바이더 (`"claude"` \| `"none"`) |
| `model` | `"claude-sonnet-4-20250514"` | 사용할 모델 |
| `apiKeyEnv` | `"ANTHROPIC_API_KEY"` | API 키를 읽을 환경변수 이름 |

## AIClient 인터페이스 (커스텀 프로바이더)

빌트인 Claude 외에 다른 AI를 연결하려면 `AIClient` 인터페이스를 구현합니다:

```ts
import type { AIClient, GenerateTestsContext } from "@commitguard/ai";

export interface AIClient {
  /** 파일별 함수 + 소스 코드 컨텍스트 → 테스트 코드 배열 */
  generateTests(context: GenerateTestsContext): Promise<string[]>;
  /** (선택) 분석 결과 → 리스크 설명 */
  analyzeRisk?(result: AnalysisResult): Promise<string>;
}
```

`GenerateTestsContext`에는 파일별 함수 목록, 테스트 프레임워크, 프로젝트 경로가 포함되어 소스 코드를 읽을 수 있습니다.

### 커스텀 클라이언트 예시

```ts
import { AIService } from "@commitguard/ai";
import type { AIClient, GenerateTestsContext } from "@commitguard/ai";

const myClient: AIClient = {
  async generateTests(context: GenerateTestsContext) {
    const results: string[] = [];
    for (const [file, fns] of context.functionsByFile) {
      // 원하는 AI API 호출
      const testCode = await callMyAI(file, fns, context.framework);
      results.push(testCode);
    }
    return results;
  },
};

const service = new AIService();
service.setClient(myClient);
const tests = await service.generateTests(changedFunctions, "vitest", repoPath);
```

## 템플릿 모드 (AI 없이)

AI 없이도 생성되는 템플릿은 소스 함수를 import하고 호출 스캐폴딩을 포함합니다:

```ts
import { describe, it, expect } from "vitest";
import { calculatePrice, applyDiscount } from "./pricing";

describe("pricing", () => {
  it("calculatePrice should work correctly", () => {
    // TODO: replace with actual arguments and expected value
    const result = calculatePrice();
    expect(result).toBeDefined();
  });
});
```
