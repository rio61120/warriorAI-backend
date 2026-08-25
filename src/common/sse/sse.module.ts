import { Module } from "@nestjs/common";

import { SseStreamService } from "@app/common/sse/sse-stream.service";

@Module({
  providers: [SseStreamService],
  exports: [SseStreamService],
})
export class SseModule {}
