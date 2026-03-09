# AI 플러그인 가이드

EasyTest는 기본적으로 템플릿 기반 테스트를 생성합니다. **AI를 사용해 edge case를 자동 생성**하려면 `AIService`에 클라이언트를 연결하면 됩니다.

## AIClient 인터페이스

```ts
import type { ChangedFunction } from "@commitguard/core";
import type { AnalysisResult } from "@commitguard/core";

export interface AIClient {
  /** 함수 목록 → 테스트 코드 문자열 배열 (파일별) */
  generateTests?(functions: ChangedFunction[]): Promise<string[]>;
  /** 분석 결과 → 리스크 설명 텍스트 */
  analyzeRisk?(result: AnalysisResult): Promise<string>;
}
```

## OpenAI 예시

```ts
import { AIService } from "@commitguard/ai";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const client: AIClient = {
  async generateTests(functions) {
    const byFile = new Map<string, ChangedFunction[]>();
    for (const cf of functions) {
      const list = byFile.get(cf.file) ?? [];
      list.push(cf);
      byFile.set(cf.file, list);
    }

    const results: string[] = [];
    for (const [file, fns] of byFile) {
      const names = fns.map((f) => f.function.name).join(", ");
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Generate Vitest tests for these functions: ${names} in ${file}. Include happy path and edge cases (null, undefined, empty).`,
          },
        ],
      });
      const content = res.choices[0]?.message?.content ?? "";
      results.push(content);
    }
    return results;
  },
};

const service = new AIService();
service.setClient(client);
// service.generateTests(changedFunctions) 호출 시 AI가 생성
```

## 사용 방법

1. `@commitguard/ai`의 `generateTestFiles`는 내부에서 `new AIService()`를 사용합니다.
2. AI를 쓰려면 `generateTestFiles`를 직접 호출하지 말고, `AIService` 인스턴스를 만들어 `setClient()` 후 `generateTests()`를 호출하세요.
3. 또는 `@commitguard/ai` 패키지에 `EASYTEST_AI=openai` 같은 환경 변수로 플러그인을 로드하는 확장 포인트를 추가할 수 있습니다 (향후).

## Edge Case 힌트 (기본 템플릿)

AI 없이도 생성되는 템플릿에는 다음 TODO가 포함됩니다:

```ts
// TODO: happy path, null/undefined, empty, invalid input
```

이를 참고해 수동으로 테스트를 보완할 수 있습니다.
