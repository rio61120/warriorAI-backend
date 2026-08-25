import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "@nestjs-modules/ioredis";

import { AiApiModule } from "@app/api/ai/ai-api.module";
import { AuthModule } from "@app/api/auth/auth.module";
import { CacheModule } from "@app/modules/cache/redis.module";
import { ConversationsModule } from "@app/api/conversations/conversations.module";
import {
  attachRedisErrorLogger,
  getRedisOptions,
  getRedisUrl,
} from "@app/config/redis.config";
import { PrismaModule } from "@app/modules/prisma/prisma.module";
import { QueueModule } from "@app/modules/queue/queue.module";
import { RefineModule } from "@app/api/refine/refine.module";
import { AiContextBuilderModule } from "@app/modules/ai-context-builder/ai-context-builder.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "single",
        onClientReady: attachRedisErrorLogger,
        url: getRedisUrl(configService),
        options: getRedisOptions(configService),
      }),
    }),
    PrismaModule,
    CacheModule,
    QueueModule,
    AuthModule,
    AiApiModule,
    RefineModule,
    ConversationsModule,
    AiContextBuilderModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
