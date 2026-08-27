export interface UploadedDocumentFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface ProcessDocumentJobData {
  documentId: string;
  fileBase64: string;
  mimetype: string;
  originalname: string;
  size: number;
  storageKey: string;
}

export const CHUNKABLE_DOCUMENT_MIME_TYPES = new Set([
  "application/json",
  "application/rtf",
  "text/csv",
  "text/markdown",
  "text/plain",
  "text/rtf",
]);

export const CHUNKABLE_DOCUMENT_EXTENSIONS = new Set([
  ".csv",
  ".json",
  ".md",
  ".markdown",
  ".rtf",
  ".txt",
]);

export function isChunkableDocumentFile(file?: Partial<UploadedDocumentFile>): boolean {
  if (!file?.originalname || !file.mimetype) {
    return false;
  }

  const extension = getFileExtension(file.originalname);

  return (
    CHUNKABLE_DOCUMENT_MIME_TYPES.has(file.mimetype) ||
    CHUNKABLE_DOCUMENT_EXTENSIONS.has(extension)
  );
}

export function getChunkableDocumentTypesLabel(): string {
  return Array.from(CHUNKABLE_DOCUMENT_EXTENSIONS).join(", ");
}

function getFileExtension(fileName: string): string {
  const extensionStart = fileName.lastIndexOf(".");

  return extensionStart >= 0 ? fileName.slice(extensionStart).toLowerCase() : "";
}
