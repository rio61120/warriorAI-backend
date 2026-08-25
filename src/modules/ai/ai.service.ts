import { Injectable } from "@nestjs/common";

import {
  LlmPromptInput,
  LlmService,
} from "@app/modules/ai/llm/llm.service";
import { AiChatRequest } from "@app/modules/ai/ai.types";
import {
  DEFAULT_CHAT_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
} from "@app/constants/prompts";
import { z } from "zod";

@Injectable()
export class AiService {
  constructor(private readonly llmService: LlmService) {}

  streamPrompt(input: LlmPromptInput): AsyncIterable<string> {
    return this.llmService.stream(input);
  }

  streamChat(request: AiChatRequest): AsyncIterable<string> {
    return this.streamPrompt({
      system: request.system || DEFAULT_CHAT_SYSTEM_PROMPT,
      prompt: request.prompt,
    });
  }

  summarizeConversation(messagesJoined: string): Promise<string> {
    return this.llmService.generateText(
      {
        system: SUMMARY_SYSTEM_PROMPT,
        prompt: messagesJoined,
      },
    );
  }

  generateObject<TOutput>(
    input: LlmPromptInput,
    schema: z.ZodType<TOutput>
  ): Promise<TOutput> {
    return this.llmService.generateObject(input, schema);
  }
}
