import { Module } from "@nestjs/common";

import { AiService } from "@app/modules/ai/ai.service";
import { LlmService } from "@app/modules/ai/llm/llm.service";

@Module({
  providers: [AiService, LlmService],
  exports: [AiService, LlmService],
})
export class AiModule {}
