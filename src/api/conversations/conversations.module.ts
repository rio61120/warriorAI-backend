import { Module } from "@nestjs/common";

import { SseModule } from "@app/common/sse/sse.module";
import { CacheModule } from "@app/modules/cache/redis.module";
import { AiModule } from "@app/modules/ai/ai.module";

import { ConversationsService } from "./conversations.service";
import { ConversationsController } from "./conversations.controller";

import { AiContextBuilderModule } from "@app/modules/ai-context-builder/ai-context-builder.module";

@Module({
  imports: [CacheModule, AiModule, SseModule, AiContextBuilderModule],
  providers: [ConversationsService],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
