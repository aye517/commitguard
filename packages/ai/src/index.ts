import type { AnalysisResult, ChangedFunction } from "@commitguard/core";

export interface AIClient {
  generateTests?(functions: ChangedFunction[]): Promise<string[]>;
  analyzeRisk?(result: AnalysisResult): Promise<string>;
}

/**
 * AI integration layer - pluggable interface for AI providers.
 * Implement this interface to add OpenAI, Anthropic, or other providers.
 */
export class AIService {
  constructor(private client?: AIClient) {}

  setClient(client: AIClient): void {
    this.client = client;
  }

  async generateTests(functions: ChangedFunction[]): Promise<string[]> {
    if (!this.client?.generateTests) {
      return [];
    }
    return this.client.generateTests(functions);
  }

  async analyzeRisk(result: AnalysisResult): Promise<string> {
    if (!this.client?.analyzeRisk) {
      return "";
    }
    return this.client.analyzeRisk(result);
  }
}

export const aiService = new AIService();
