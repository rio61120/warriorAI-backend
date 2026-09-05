CREATE INDEX IF NOT EXISTS "document_chunks_embedding_hnsw_idx"
ON "document-chunks"
USING hnsw ("embedding" vector_cosine_ops);
