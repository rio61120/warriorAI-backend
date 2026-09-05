import { Module } from "@nestjs/common";

import { AiModule } from "@app/modules/ai/ai.module";
import { VectorSearchService } from "@app/modules/vector-search/vector-search.service";

@Module({
  imports: [AiModule],
  providers: [VectorSearchService],
  exports: [VectorSearchService],
})
export class VectorSearchModule {}
