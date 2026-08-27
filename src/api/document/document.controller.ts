import {
  Controller,
  FileValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { IFile } from "@nestjs/common/pipes/file/interfaces";
import { DocumentsService } from "./document.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

import {
  getChunkableDocumentTypesLabel,
  isChunkableDocumentFile,
  UploadedDocumentFile,
} from "@app/api/document/document-file.types";
import { MAX_DOCUMENT_UPLOAD_BYTES } from "@app/api/document/document.constants";

class ChunkableDocumentFileValidator extends FileValidator<
  Record<string, never>,
  IFile
> {
  isValid(file?: IFile): boolean {
    return isChunkableDocumentFile(file);
  }

  buildErrorMessage(): string {
    return `Unsupported document type. Supported file types: ${getChunkableDocumentTypesLabel()}`;
  }
}

@Controller("document")
export class DocumentController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
    }),
  )
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_DOCUMENT_UPLOAD_BYTES }),
          new ChunkableDocumentFileValidator({}),
        ],
      }),
    )
    file: UploadedDocumentFile,
  ) {
    return this.documentsService.createDocument(file);
  }
}
