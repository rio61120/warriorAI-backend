import { createHash } from "node:crypto";

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@app/modules/prisma/prisma.service";
import { EmbeddingService } from "@app/modules/ai/embedding/embedding.service";
import { CacheService } from "@app/modules/cache/redis.service";

const SEARCH_CACHE_TTL_SECONDS = 300;

@Injectable()
export class VectorSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly cacheService: CacheService,
  ) {}

  async saveEmbedding(documentId: string, chunkIndex: number, content: string) {
    const embedding = await this.embeddingService.embedText(content);

    const vector = `[${embedding.join(",")}]`;

    await this.prisma.$executeRaw`
      UPDATE "document-chunks"
      SET embedding = ${vector}::vector
      WHERE "documentId" = ${documentId}::uuid AND "chunkIndex" = ${chunkIndex}
    `;
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { userId: true },
    });

    if (document) {
      await this.cacheService.deleteByPrefix(
        `user:${document.userId}:document-search:`,
      );
    }

    console.log(
      `Saved embedding for chunk ${chunkIndex} of document ${documentId}`,
    );
  }

  async searchEmbeddings(
    userId: string,
    question: string,
    limit = 5,
    documentId?: string,
  ) {
    const normalizedQuestion = question?.trim();

    if (!normalizedQuestion) {
      throw new BadRequestException("Search query is required");
    }

    if (documentId) {
      await this.assertOwnsDocument(userId, documentId);
    }

    const parsedLimit = Number.isFinite(limit) ? limit : 5;
    const safeLimit = Math.min(Math.max(parsedLimit, 1), 20);
    const cacheKey = this.getSearchCacheKey(
      userId,
      normalizedQuestion,
      safeLimit,
      documentId,
    );
    const cachedResults = await this.cacheService.getCache<unknown[]>(cacheKey);

    if (cachedResults) {
      return cachedResults;
    }

    const embedding = await this.embeddingService.embedText(normalizedQuestion);

    const vector = `[${embedding.join(",")}]`;
    let results: unknown[];

    if (documentId) {
      results = await this.prisma.$queryRaw`
      SELECT
        c.id,
        c.content,
        c."documentId",
        c."chunkIndex",
        c.embedding <=> ${vector}::vector AS distance
      FROM "document-chunks" c
      JOIN "documents" d ON d.id = c."documentId"
      WHERE c.embedding IS NOT NULL
        AND c."documentId" = ${documentId}::uuid
        AND d."userId" = ${userId}::uuid
      ORDER BY distance ASC
      LIMIT ${safeLimit};
    `;
    } else {
      results = await this.prisma.$queryRaw`
      SELECT
        c.id,
        c.content,
        c."documentId",
        c."chunkIndex",
        c.embedding <=> ${vector}::vector AS distance
      FROM "document-chunks" c
      JOIN "documents" d ON d.id = c."documentId"
      WHERE c.embedding IS NOT NULL
        AND d."userId" = ${userId}::uuid
      ORDER BY distance ASC
      LIMIT ${safeLimit};
    `;
    }

    await this.cacheService.setCache(
      cacheKey,
      results,
      SEARCH_CACHE_TTL_SECONDS,
    );
    return results;
  }

  private async assertOwnsDocument(
    userId: string,
    documentId: string,
  ): Promise<void> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
      select: { id: true },
    });

    if (!document) {
      throw new NotFoundException(`Document not found with id: ${documentId}`);
    }
  }

  private getSearchCacheKey(
    userId: string,
    question: string,
    limit: number,
    documentId?: string,
  ): string {
    const hash = createHash("sha256").update(question).digest("hex");
    return `user:${userId}:document-search:${documentId ?? "all"}:${limit}:${hash}`;
  }
}
