import { Injectable } from "@nestjs/common";
import { embed } from "ai";

import { AiIntegrationService } from "@app/modules/ai/ai-integration.service";

@Injectable()
export class EmbeddingService {
  constructor(private readonly aiIntegration: AiIntegrationService) {}

  async embedText(text: string) {
    const result = await embed({
      model: await this.aiIntegration.getEmbeddingModel(),
      value: text,
    });

    return result.embedding;
  }
}
