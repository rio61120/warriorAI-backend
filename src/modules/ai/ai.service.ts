import { Injectable } from "@nestjs/common";

import { LlmService } from "@app/modules/ai/llm/llm.service";
import { AiChatRequest } from "@app/modules/ai/ai.types";
import {
  AiPromptInput,
  AiPromptService,
} from "@app/modules/prompts/ai-prompt.service";

const DEFAULT_SYSTEM_PROMPT =
  "You are warriorAI, a helpful AI assistant. Answer clearly and directly.";

@Injectable()
export class AiService {
  constructor(
    private readonly llmService: LlmService,
    private readonly promptService: AiPromptService,
  ) {}

  streamPrompt(input: AiPromptInput): AsyncIterable<string> {
    return this.llmService.stream(this.promptService.buildMessages(input));
  }

  streamChat(request: AiChatRequest): AsyncIterable<string> {
    return this.streamPrompt({
      systemPrompt: request.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      userPrompt: request.prompt,
    });
  }

  summarizeConversation(messagesJoined: string): Promise<string> {
    return this.llmService.generateText(
      this.promptService.buildMessages({
        systemPrompt:
          "You are warriorAI, a helpful AI assistant. Please summarize the user input in a few sentences.",
        userPrompt: messagesJoined,
      }),
    );
  }
}
