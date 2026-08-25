import { Module } from "@nestjs/common";

import { AiPromptService } from "@app/modules/prompts/ai-prompt.service";

@Module({
  providers: [AiPromptService],
  exports: [AiPromptService],
})
export class PromptsModule {}
