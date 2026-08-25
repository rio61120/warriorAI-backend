import { LlmPromptInput } from "@app/modules/ai/llm/llm.service";

export const formatPrompt = (
  prompt: string,
  system: string
): LlmPromptInput => ({
  prompt,
  system,
});
