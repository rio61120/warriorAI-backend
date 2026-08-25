import { Injectable } from "@nestjs/common";
import type { ModelMessage } from "ai";

export interface AiPromptInput {
  systemPrompt: string;
  userPrompt: string;
}

@Injectable()
export class AiPromptService {
  buildMessages(input: AiPromptInput): ModelMessage[] {
    return [
      {
        role: "system",
        content: input.systemPrompt,
      },
      {
        role: "user",
        content: input.userPrompt,
      },
    ];
  }
}
