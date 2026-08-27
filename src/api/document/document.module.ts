import { Module } from "@nestjs/common";
import { DocumentsService } from "./document.service";
import { BullModule } from "@nestjs/bullmq";
import { DocumentController } from "@app/api/document/document.controller";
import { DocumentProcessor } from "@app/api/document/processing/document.processor";
import { DocumentExtractorService } from "@app/api/document/extractor/document.extractor.service";
import { R2StorageModule } from "@app/modules/storage/r2-storage.module";
import { DOCUMENTS_QUEUE } from "@app/api/document/document.constants";

@Module({
  imports: [
    R2StorageModule,
    BullModule.registerQueue({
      name: DOCUMENTS_QUEUE,
    }),
  ],
  providers: [DocumentsService, DocumentProcessor, DocumentExtractorService],
  controllers: [DocumentController],
})
export class DocumentsModule {}
