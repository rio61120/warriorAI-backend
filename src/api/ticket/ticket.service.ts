import { AiService } from "@app/modules/ai/ai.service";
import { Injectable } from "@nestjs/common";
import { TicketClassificationSchema } from "@app/api/ticket/dto/ticket.schema";
import { z } from "zod";
import { formatPrompt } from "@app/helpers/prompt";
import { CLASSIFY_SYSTEM_PROMPT } from "@app/constants/prompts";

type TicketClassification = z.infer<typeof TicketClassificationSchema>;

@Injectable()
export class TicketService {
  constructor(private readonly aiService: AiService) {}

  async classify(prompt: string): Promise<TicketClassification> {
    const response = await this.aiService.generateObject(
      formatPrompt(prompt, CLASSIFY_SYSTEM_PROMPT),
      TicketClassificationSchema
    );

    return response;
  }
}
