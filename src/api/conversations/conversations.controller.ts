import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
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
import { AuthenticatedRequest } from "@app/api/auth/interfaces/authenticated-request.interface";
import { SseStreamService } from "@app/common/sse/sse-stream.service";

@Controller("conversations")
export class ConversationsController {
  constructor(
    private readonly conversationService: ConversationsService,
    private readonly sseStreamService: SseStreamService,
  ) {}

  @Get()
  getConversations(
    @Req() request: AuthenticatedRequest,
  ): Promise<ConversationResponseDto[]> {
    return this.conversationService.getAllConversations(request.user.id);
  }

  @Post()
  createConversation(
    @Req() request: AuthenticatedRequest,
    @Body() conversationData: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.conversationService.createConversation(
      request.user.id,
      conversationData,
    );
  }

  @Get("/:id")
  getConversationsById(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ): Promise<ConversationResponseDto> {
    return this.conversationService.getConversationsById(request.user.id, id);
  }

  @Get("/:id/messages")
  getMessagesByConversationId(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ): Promise<MessageResponseDto[]> {
    return this.conversationService.getMessagesByConId(request.user.id, id);
  }

  @Post("/:conversationId/message")
  createMessage(
    @Req() request: AuthenticatedRequest,
    @Param("conversationId") conversationId: string,
    @Body()
    messageData: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.conversationService.createMessage(
      request.user.id,
      conversationId,
      messageData.role,
      messageData.content,
    );
  }

  @Post("/:conversationId/ask")
  async askAI(
    @Req() request: AuthenticatedRequest,
    @Param("conversationId") conversationId: string,
    @Body() body: AskConversationDto,
    @Res() response: Response,
  ): Promise<void> {
    const userMessage = await this.conversationService.createMessage(
      request.user.id,
      conversationId,
      MessageRole.USER,
      body.message,
    );

    return this.sseStreamService.streamText(
      response,
      this.conversationService.askAI(
        request.user.id,
        conversationId,
        body.message,
        userMessage.id,
      ),
      {
        errorMessage: "Unknown conversation AI error",
        onComplete: async (fullResponse) => {
          await this.conversationService.createMessage(
            request.user.id,
            conversationId,
            MessageRole.ASSISTANT,
            fullResponse,
          );
        },
      },
    );
  }
}
