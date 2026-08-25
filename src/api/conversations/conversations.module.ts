import { Module } from "@nestjs/common";

import { SseModule } from "@app/common/sse/sse.module";
import { CacheModule } from "@app/modules/cache/redis.module";
import { AiModule } from "@app/modules/ai/ai.module";

import { ConversationsService } from "./conversations.service";
import { ConversationsController } from "./conversations.controller";

@Module({
  imports: [CacheModule, AiModule, SseModule],
  providers: [ConversationsService],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
