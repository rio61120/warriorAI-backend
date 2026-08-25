import { Body, Controller, Post, Res } from "@nestjs/common";
import type { Response } from "express";

import { AiChatRequestDto } from "@app/api/ai/dto/ai-chat-request.dto";
import { SseStreamService } from "@app/common/sse/sse-stream.service";
import { AiService } from "@app/modules/ai/ai.service";

@Controller("ai")
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly sseStreamService: SseStreamService,
  ) {}

  @Post("chat")
  chat(
    @Body() request: AiChatRequestDto,
    @Res() response: Response,
  ): Promise<void> {
    return this.sseStreamService.streamText(
      response,
      this.aiService.streamChat(request),
      { errorMessage: "Unknown AI error" },
    );
  }
}
