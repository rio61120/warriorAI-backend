import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { EnvKey } from "@app/config/env-key.enum";

export interface UploadObjectInput {
  body: Buffer;
  contentType: string;
  key: string;
}

@Injectable()
export class R2StorageService {
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.getRequiredConfig(EnvKey.R2AccountId);
    const accessKeyId = this.getRequiredConfig(EnvKey.R2AccessKeyId);
    const secretAccessKey = this.getRequiredConfig(EnvKey.R2SecretAccessKey);

    this.bucket = this.getRequiredConfig(EnvKey.R2BucketName);
    this.publicUrl = this.getRequiredConfig(EnvKey.R2PublicUrl).replace(/\/$/, "");
    this.client = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      region: "auto",
    });
  }

  async uploadObject(input: UploadObjectInput): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Body: input.body,
        Bucket: this.bucket,
        ContentType: input.contentType,
        Key: input.key,
      }),
    );

    return input.key;
  }

  getObjectUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      throw new Error(`${key} is not configured`);
    }

    return value;
  }
}
