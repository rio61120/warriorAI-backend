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
import { buildPrompt } from "@app/modules/prompts/templates";
import { PrismaService } from "@app/modules/prisma/prisma.service";

const ALL_CONVERSATIONS_CACHE_KEY = "conversations:all";
const CONVERSATION_CACHE_TTL_SECONDS = 300;

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly aiService: AiService,
  ) {}

  async getAllConversations(): Promise<ConversationResponseDto[]> {
    try {
      const cachedConversations =
        await this.cacheService.getCache<ConversationResponseDto[]>(
          ALL_CONVERSATIONS_CACHE_KEY,
        );

      if (cachedConversations) {
        return cachedConversations;
      }

      const conversations = await this.prisma.conversation.findMany();

      await this.cacheService.setCache(
        ALL_CONVERSATIONS_CACHE_KEY,
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
    dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    try {
      const response = await this.prisma.conversation.create({
        data: dto,
      });
      await this.cacheService.setCache(
        this.getConversationCacheKey(response.id),
        response,
        CONVERSATION_CACHE_TTL_SECONDS,
      );
      await this.cacheService.deleteCache(ALL_CONVERSATIONS_CACHE_KEY);

      return response;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create conversation: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async getConversationsById(id: string): Promise<ConversationResponseDto> {
    try {
      const cachedConKey = this.getConversationCacheKey(id);
      const cachedConversation =
        await this.cacheService.getCache<ConversationResponseDto>(cachedConKey);
      if (cachedConversation) {
        return cachedConversation;
      }
      const response = await this.prisma.conversation.findUnique({
        where: { id },
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
    conversationId: string,
  ): Promise<MessageResponseDto[]> {
    try {
      const response = await this.prisma.message.findMany({
        where: { conversationId },
      });

      if (!response || response.length === 0) {
        throw new NotFoundException(
          `No messages found for conversation id: ${conversationId}`,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to get messages by conversation id: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async createMessage(
    conversationId: string,
    role: MessageRole,
    content: string,
  ): Promise<MessageResponseDto> {
    try {
      const response = await this.prisma.message.create({
        data: {
          conversationId,
          role,
          content,
        },
      });
      await this.cacheService.deleteCache(
        this.getConversationCacheKey(conversationId),
      );

      return response;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create message: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async *askAI(message: string): AsyncIterableIterator<string> {
    const prompt = buildPrompt(message);
    yield* this.aiService.streamChat(prompt);
  }

  private getConversationCacheKey(id: string): string {
    return `conversation:${id}`;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
  }
}
