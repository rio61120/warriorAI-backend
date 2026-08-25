import { AiPromptInput } from "@app/modules/prompts/ai-prompt.service";

export type RefinePromptAction = "grammar" | "translate";

interface BuildRefinePromptInput {
  action: RefinePromptAction;
  message: string;
  targetLanguage: string;
}

const SYSTEM_PROMPT = [
  "You are warriorAI, a precise AI writing assistant.",
  "Return only the final message text. Do not add explanations, labels, markdown fences, greetings, or alternatives.",
  "Preserve the user's intent, names, URLs, code snippets, ticket IDs, emojis, and line breaks unless they are clearly incorrect.",
  "Keep the tone natural for workplace chat: concise, clear, and polite.",
].join(" ");

const ACTION_INSTRUCTIONS: Record<RefinePromptAction, string> = {
  grammar:
    "Fix spelling, grammar, punctuation, and awkward phrasing while preserving the original language and meaning.",
  translate:
    "Translate the message into the requested target language. Preserve URLs, IDs, mentions, and product names exactly.",
};

export function buildRefinePrompt(input: BuildRefinePromptInput): AiPromptInput {
  const actionInstruction =
    input.action === "translate"
      ? `${ACTION_INSTRUCTIONS[input.action]} Target language: ${input.targetLanguage}.`
      : ACTION_INSTRUCTIONS[input.action];

  return {
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `${actionInstruction}\n\nMessage:\n${input.message}`,
  };
}
