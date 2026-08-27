import { BadRequestException, Injectable } from "@nestjs/common";

import {
  getChunkableDocumentTypesLabel,
  isChunkableDocumentFile,
  UploadedDocumentFile,
} from "@app/api/document/document-file.types";
import { cleanText } from "@app/helpers/format-text";

@Injectable()
export class DocumentExtractorService {
  canExtract(file: UploadedDocumentFile): boolean {
    return isChunkableDocumentFile(file);
  }

  assertCanExtract(file: UploadedDocumentFile): void {
    if (!this.canExtract(file)) {
      throw new BadRequestException(
        `Unsupported document type. Supported file types: ${getChunkableDocumentTypesLabel()}`,
      );
    }
  }

  extractTextFromBuffer(file: UploadedDocumentFile): string {
    this.assertCanExtract(file);

    const text = file.buffer.toString("utf-8");

    return this.isRtf(file)
      ? this.extractTextFromRtf(text)
      : cleanText(text);
  }

  private extractTextFromRtf(rtf: string): string {
    return cleanText(
      rtf
        .replace(/\\'[0-9a-fA-F]{2}/g, " ")
        .replace(/\\[a-zA-Z]+-?\d* ?/g, " ")
        .replace(/[{}]/g, " "),
    );
  }

  private isRtf(file: UploadedDocumentFile): boolean {
    return file.mimetype === "application/rtf" || file.mimetype === "text/rtf";
  }
}
