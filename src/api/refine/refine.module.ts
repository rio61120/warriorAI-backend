import { Module } from "@nestjs/common";

import { SseModule } from "@app/common/sse/sse.module";
import { AiModule } from "@app/modules/ai/ai.module";
import { AiContextBuilderModule } from "@app/modules/ai-context-builder/ai-context-builder.module";
import { RefineController } from "@app/api/refine/refine.controller";
import { RefineService } from "@app/api/refine/refine.service";

@Module({
  imports: [AiModule, AiContextBuilderModule, SseModule],
  controllers: [RefineController],
  providers: [RefineService],
})
export class RefineModule {}
