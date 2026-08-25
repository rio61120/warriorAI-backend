import { AiService } from "@app/modules/ai/ai.service";
import { PrismaService } from "@app/modules/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import type { Message } from "@prisma/client";

export interface AiContext {
  summary?: string;
  recentMessages: Message[];
  userInput: string;
}

@Injectable()
export class AiContextBuilderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async build(userInput: string): Promise<AiContext> {
    const recentMessages = await this.prisma.message.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const summaryMessage = await this.ai.summarizeConversation(
      recentMessages.map((message) => message.content).join("\n"),
    );

    return {
      summary: summaryMessage,
      recentMessages: recentMessages.reverse(),
      userInput,
    };
  }
}
