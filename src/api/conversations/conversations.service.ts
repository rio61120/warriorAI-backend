import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { MessageRole } from "@prisma/client";

import {
  ConversationResponseDto,
  CreateConversationDto,
  MessageResponseDto,
} from "@app/api/conversations/dto/conversations.dto";
import { AiService } from "@app/modules/ai/ai.service";
import { CacheService } from "@app/modules/cache/redis.service";
import { PrismaService } from "@app/modules/prisma/prisma.service";
import { AiContextBuilderService } from "@app/modules/ai-context-builder/ai-context-builder.service";

const CONVERSATION_CACHE_TTL_SECONDS = 300;

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly aiService: AiService,
    private readonly aiBuilderContext: AiContextBuilderService,
  ) {}

  async getAllConversations(userId: string): Promise<ConversationResponseDto[]> {
    try {
      const cacheKey = this.getUserConversationsCacheKey(userId);
      const cachedConversations = await this.cacheService.getCache<
        ConversationResponseDto[]
      >(cacheKey);

      if (cachedConversations) {
        return cachedConversations;
      }

      const conversations = await this.prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

      await this.cacheService.setCache(
        cacheKey,
        conversations,
        CONVERSATION_CACHE_TTL_SECONDS,
      );

      return conversations;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get all conversations: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async createConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    try {
      const response = await this.prisma.conversation.create({
        data: {
          userId,
          title: dto.title,
        },
      });
      await this.cacheService.setCache(
        this.getConversationCacheKey(userId, response.id),
        response,
        CONVERSATION_CACHE_TTL_SECONDS,
      );
      await this.cacheService.deleteCache(
        this.getUserConversationsCacheKey(userId),
      );

      return response;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create conversation: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async getConversationsById(
    userId: string,
    id: string,
  ): Promise<ConversationResponseDto> {
    try {
      const cachedConKey = this.getConversationCacheKey(userId, id);
      const cachedConversation =
        await this.cacheService.getCache<ConversationResponseDto>(cachedConKey);
      if (cachedConversation) {
        return cachedConversation;
      }
      const response = await this.prisma.conversation.findFirst({
        where: { id, userId },
      });

      if (!response) {
        throw new NotFoundException(`Conversation not found with id: ${id}`);
      }
      await this.cacheService.setCache(
        cachedConKey,
        response,
        CONVERSATION_CACHE_TTL_SECONDS,
      );
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to get conversation by id: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async getMessagesByConId(
    userId: string,
    conversationId: string,
  ): Promise<MessageResponseDto[]> {
    try {
      await this.assertOwnsConversation(userId, conversationId);
      const cacheKey = this.getMessagesCacheKey(userId, conversationId);
      const cachedMessages =
        await this.cacheService.getCache<MessageResponseDto[]>(cacheKey);

      if (cachedMessages) {
        return cachedMessages;
      }

      const response = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
      });

      await this.cacheService.setCache(
        cacheKey,
        response,
        CONVERSATION_CACHE_TTL_SECONDS,
      );

      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to get messages by conversation id: ${this.getErrorMessage(
          error,
        )}`,
      );
    }
  }

  async createMessage(
    userId: string,
    conversationId: string,
    role: MessageRole,
    content: string,
  ): Promise<MessageResponseDto> {
    try {
      await this.assertOwnsConversation(userId, conversationId);
      const response = await this.prisma.message.create({
        data: {
          conversationId,
          role,
          content,
        },
      });
      await this.cacheService.deleteCache(
        this.getConversationCacheKey(userId, conversationId),
      );
      await this.cacheService.deleteCache(
        this.getMessagesCacheKey(userId, conversationId),
      );
      await this.cacheService.deleteCache(
        this.getUserConversationsCacheKey(userId),
      );

      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to create message: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async *askAI(
    userId: string,
    conversationId: string,
    message: string,
    currentMessageId?: string,
  ): AsyncIterableIterator<string> {
    const promptBuilt = await this.aiBuilderContext.buildUserPrompt(
      userId,
      conversationId,
      message,
      currentMessageId,
    );
    yield* this.aiService.streamChat(promptBuilt);
  }

  private async assertOwnsConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation not found with id: ${conversationId}`,
      );
    }
  }

  private getUserConversationsCacheKey(userId: string): string {
    return `user:${userId}:conversations`;
  }

  private getConversationCacheKey(userId: string, id: string): string {
    return `user:${userId}:conversation:${id}`;
  }

  private getMessagesCacheKey(userId: string, conversationId: string): string {
    return `user:${userId}:conversation:${conversationId}:messages`;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
  }
}
