import { Module } from "@nestjs/common";

import { AiIntegrationService } from "@app/modules/ai/ai-integration.service";
import { AiService } from "@app/modules/ai/ai.service";
import { LlmService } from "@app/modules/ai/llm/llm.service";
import { EmbeddingService } from "./embedding/embedding.service";

@Module({
  providers: [AiIntegrationService, AiService, LlmService, EmbeddingService],
  exports: [AiService, LlmService, EmbeddingService],
})
export class AiModule {}
