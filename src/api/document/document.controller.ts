import {
  Controller,
  FileValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Query,
  Req,
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
import { AuthenticatedRequest } from "@app/api/auth/interfaces/authenticated-request.interface";
import { VectorSearchService } from "@app/modules/vector-search/vector-search.service";

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
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly vectorSearchService: VectorSearchService,
  ) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
    }),
  )
  async uploadDocument(
    @Req() request: AuthenticatedRequest,
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
    return this.documentsService.createDocument(request.user.id, file);
  }

  @Get()
  async search(
    @Req() request: AuthenticatedRequest,
    @Query("q") question: string,
    @Query("limit") limit?: string,
    @Query("documentId") documentId?: string,
  ) {
    return this.vectorSearchService.searchEmbeddings(
      request.user.id,
      question,
      limit ? Number(limit) : 5,
      documentId,
    );
  }
}
