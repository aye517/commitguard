import { loadConfigFromProject, type AIProvider } from "@commitguard/config";
import type { AIClient } from "./types.js";
import { ClaudeClient } from "./clients/claude.js";

/**
 * Resolve AI client from config and environment variables.
 * Returns undefined if provider is "none" or API key is missing.
 */
export function resolveAIClient(repoPath?: string): AIClient | undefined {
  const config = loadConfigFromProject(repoPath);
  const aiConfig = config.ai;

  // CLI/env override: COMMITGUARD_AI_PROVIDER
  const envProvider = process.env.COMMITGUARD_AI_PROVIDER as
    | AIProvider
    | undefined;
  const provider = envProvider ?? aiConfig?.provider ?? "none";

  if (provider === "none") return undefined;

  const apiKeyEnv = aiConfig?.apiKeyEnv ?? "ANTHROPIC_API_KEY";
  const apiKey = process.env[apiKeyEnv];

  if (!apiKey) {
    console.warn(
      `⚠️  AI provider "${provider}" selected but ${apiKeyEnv} is not set. Falling back to template generation.`
    );
    return undefined;
  }

  if (provider === "claude") {
    return new ClaudeClient(apiKey, aiConfig?.model);
  }

  console.warn(
    `⚠️  Unknown AI provider "${provider}". Falling back to template generation.`
  );
  return undefined;
}
