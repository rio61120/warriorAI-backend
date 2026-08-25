import { Injectable, Logger } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";

const CACHE_KEY_PREFIX = "warriorai";
const DEFAULT_CACHE_TTL_SECONDS = 60;

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async setCache(
    key: string,
    value: unknown,
    ttlInSeconds = DEFAULT_CACHE_TTL_SECONDS,
  ): Promise<void> {
    try {
      await this.redis.set(
        this.normalizeKey(key),
        JSON.stringify(value),
        "EX",
        ttlInSeconds,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to write cache key "${key}": ${this.getErrorMessage(error)}`,
      );
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    const cacheKey = this.normalizeKey(key);

    try {
      const data = await this.redis.get(cacheKey);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.warn(
        `Failed to read cache key "${key}": ${this.getErrorMessage(error)}`,
      );
      await this.deleteCache(cacheKey);
      return null;
    }
  }

  async deleteCache(key: string): Promise<void> {
    try {
      await this.redis.del(this.normalizeKey(key));
    } catch (error) {
      this.logger.warn(
        `Failed to delete cache key "${key}": ${this.getErrorMessage(error)}`,
      );
    }
  }

  private normalizeKey(key: string): string {
    return key.startsWith(`${CACHE_KEY_PREFIX}:`)
      ? key
      : `${CACHE_KEY_PREFIX}:${key}`;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown Redis error";
  }
}
