import { Body, Controller, Get, Param, Post, Res } from "@nestjs/common";
import { MessageRole } from "@prisma/client";
import type { Response } from "express";

import {
  AskConversationDto,
  ConversationResponseDto,
  CreateConversationDto,
  CreateMessageDto,
  MessageResponseDto,
} from "@app/api/conversations/dto/conversations.dto";
import { ConversationsService } from "@app/api/conversations/conversations.service";
import { SseStreamService } from "@app/common/sse/sse-stream.service";

@Controller("conversations")
export class ConversationsController {
  constructor(
    private readonly conversationService: ConversationsService,
    private readonly sseStreamService: SseStreamService,
  ) {}

  @Get()
  getConversations(): Promise<ConversationResponseDto[]> {
    return this.conversationService.getAllConversations();
  }

  @Post()
  createConversation(
    @Body() conversationData: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.conversationService.createConversation(conversationData);
  }

  @Get("/:id")
  getConversationsById(
    @Param("id") id: string,
  ): Promise<ConversationResponseDto> {
    return this.conversationService.getConversationsById(id);
  }

  @Get("/:id/messages")
  getMessagesByConversationId(
    @Param("id") id: string,
  ): Promise<MessageResponseDto[]> {
    return this.conversationService.getMessagesByConId(id);
  }

  @Post("/:conversationId/message")
  createMessage(
    @Param("conversationId") conversationId: string,
    @Body()
    messageData: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.conversationService.createMessage(
      conversationId,
      messageData.role,
      messageData.content,
    );
  }

  @Post("/:conversationId/ask")
  async askAI(
    @Param("conversationId") conversationId: string,
    @Body() request: AskConversationDto,
    @Res() response: Response,
  ): Promise<void> {
    const userMessage = await this.conversationService.createMessage(
      conversationId,
      MessageRole.USER,
      request.message,
    );

    return this.sseStreamService.streamText(
      response,
      this.conversationService.askAI(
        conversationId,
        request.message,
        userMessage.id,
      ),
      {
        errorMessage: "Unknown conversation AI error",
        onComplete: async (fullResponse) => {
          await this.conversationService.createMessage(
            conversationId,
            MessageRole.ASSISTANT,
            fullResponse,
          );
        },
      },
    );
  }
}
