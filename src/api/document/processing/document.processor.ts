import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { DocumentStatus } from "@prisma/client";

import { ProcessDocumentJobData } from "@app/api/document/document-file.types";
import { DocumentExtractorService } from "@app/api/document/extractor/document.extractor.service";
import { PrismaService } from "@app/modules/prisma/prisma.service";
import { R2StorageService } from "@app/modules/storage/r2-storage.service";
import {
  DOCUMENT_CHUNK_SIZE,
  DOCUMENTS_QUEUE,
} from "@app/api/document/document.constants";

@Processor(DOCUMENTS_QUEUE)
export class DocumentProcessor extends WorkerHost {
  constructor(
    private readonly documentExtractor: DocumentExtractorService,
    private readonly prisma: PrismaService,
    private readonly r2StorageService: R2StorageService,
  ) {
    super();
  }

  async process(job: Job<ProcessDocumentJobData>) {
    const file = {
      buffer: Buffer.from(job.data.fileBase64, "base64"),
      mimetype: job.data.mimetype,
      originalname: job.data.originalname,
      size: job.data.size,
    };

    try {
      await this.prisma.document.update({
        data: { status: DocumentStatus.PROCESSING },
        where: { id: job.data.documentId },
      });

      await this.r2StorageService.uploadObject({
        body: file.buffer,
        contentType: file.mimetype,
        key: job.data.storageKey,
      });

      await this.prisma.document.update({
        data: { status: DocumentStatus.CHUNKING },
        where: { id: job.data.documentId },
      });

      const text = this.documentExtractor.extractTextFromBuffer(file);
      const chunks = this.chunkText(text);

      await this.prisma.documentChunk.deleteMany({
        where: { documentId: job.data.documentId },
      });

      if (chunks.length > 0) {
        await this.prisma.documentChunk.createMany({
          data: chunks.map((content, index) => ({
            chunkIndex: index,
            content,
            documentId: job.data.documentId,
          })),
        });
      }

      await this.prisma.document.update({
        data: { status: DocumentStatus.COMPLETED },
        where: { id: job.data.documentId },
      });
    } catch (error) {
      await this.prisma.document.update({
        data: { status: DocumentStatus.FAILED },
        where: { id: job.data.documentId },
      });

      throw error;
    }
  }

  private chunkText(text: string): string[] {
    const normalizedText = text.trim();

    if (!normalizedText) {
      return [];
    }

    const chunks: string[] = [];

    for (let index = 0; index < normalizedText.length; index += DOCUMENT_CHUNK_SIZE) {
      chunks.push(normalizedText.slice(index, index + DOCUMENT_CHUNK_SIZE));
    }

    return chunks;
  }
}
