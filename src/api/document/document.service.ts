import { ConflictException, Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Prisma } from "@prisma/client";

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
import { CacheService } from "@app/modules/cache/redis.service";

@Injectable()
export class DocumentsService {
  constructor(
    @InjectQueue(DOCUMENTS_QUEUE)
    private readonly documentsQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly documentExtractor: DocumentExtractorService,
    private readonly cacheService: CacheService,
  ) {}

  async createDocument(userId: string, file: UploadedDocumentFile) {
    const documentName = file.originalname.trim();
    const storageKey = this.createStorageKey(documentName);
    this.documentExtractor.assertCanExtract(file);

    const existingDocument = await this.prisma.document.findFirst({
      where: {
        userId,
        name: documentName,
      },
      select: { id: true },
    });

    if (existingDocument) {
      throw new ConflictException("Document already exists for this user");
    }

    const document = await this.createDocumentRecord(
      userId,
      file,
      documentName,
      storageKey,
    );

    await this.processDocument(document.id, file, storageKey);
    await this.cacheService.deleteByPrefix(`user:${userId}:document-search:`);

    return {
      ...document,
      queued: true,
    };
  }

  private async createDocumentRecord(
    userId: string,
    file: UploadedDocumentFile,
    documentName: string,
    storageKey: string,
  ) {
    try {
      return await this.prisma.document.create({
        data: {
          userId,
          mimeType: file.mimetype,
          name: documentName,
          storageKey,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Document already exists for this user");
      }

      throw error;
    }
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
