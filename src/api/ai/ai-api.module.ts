import { Module } from "@nestjs/common";

import { SseModule } from "@app/common/sse/sse.module";
import { AiModule } from "@app/modules/ai/ai.module";

import { AiController } from "./ai.controller";

@Module({
  imports: [AiModule, SseModule],
  controllers: [AiController],
})
export class AiApiModule {}
