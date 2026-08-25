import { Module } from "@nestjs/common";

import { AiService } from "@app/modules/ai/ai.service";
import { LlmService } from "@app/modules/ai/llm/llm.service";
import { PromptsModule } from "@app/modules/prompts/prompts.module";

@Module({
  imports: [PromptsModule],
  providers: [AiService, LlmService],
  exports: [AiService, LlmService],
})
export class AiModule {}
