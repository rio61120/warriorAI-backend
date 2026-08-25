import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { getBullMqRedisOptions } from "@app/config/redis.config";

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: getBullMqRedisOptions(configService),
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
