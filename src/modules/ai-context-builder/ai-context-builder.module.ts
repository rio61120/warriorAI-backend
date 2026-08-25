import { Module } from "@nestjs/common";

import { AiModule } from "@app/modules/ai/ai.module";

import { AiContextBuilderService } from "./ai-context-builder.service";

@Module({
  imports: [AiModule],
  providers: [AiContextBuilderService],
  exports: [AiContextBuilderService],
})
export class AiContextBuilderModule {}
