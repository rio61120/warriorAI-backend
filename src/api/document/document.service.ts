import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "@app/modules/prisma/prisma.service";
import { randomUUID } from "node:crypto";
import { DocumentExtractorService } from "@app/api/document/extractor/document.extractor.service";
import {
  ProcessDocumentJobData,
  UploadedDocumentFile,
} from "@app/api/document/document-file.types";
import {
  DOCUMENTS_QUEUE,
  PROCESS_DOCUMENT_JOB,
} from "@app/api/document/document.constants";

@Injectable()
export class DocumentsService {
  constructor(
    @InjectQueue(DOCUMENTS_QUEUE)
    private readonly documentsQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly documentExtractor: DocumentExtractorService,
  ) {}

  async createDocument(file: UploadedDocumentFile) {
    const storageKey = this.createStorageKey(file.originalname);
    this.documentExtractor.assertCanExtract(file);

    const document = await this.prisma.document.create({
      data: {
        mimeType: file.mimetype,
        name: file.originalname,
        storageKey,
      },
    });

    await this.processDocument(document.id, file, storageKey);

    return {
      ...document,
      queued: true,
    };
  }

  async processDocument(
    documentId: string,
    file: UploadedDocumentFile,
    storageKey: string,
  ) {
    await this.documentsQueue.add(PROCESS_DOCUMENT_JOB, {
      documentId,
      fileBase64: file.buffer.toString("base64"),
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
      storageKey,
    } satisfies ProcessDocumentJobData);
  }

  private createStorageKey(originalName: string): string {
    const safeFileName = originalName
      .trim()
      .replace(/[/\\]/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return `documents/${randomUUID()}-${safeFileName || "document"}`;
  }
}
