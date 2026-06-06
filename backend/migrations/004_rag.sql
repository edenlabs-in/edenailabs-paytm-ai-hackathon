-- RAG knowledge base (pgvector). RUN AFTER 003_backend_core.sql. Idempotent.

CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base: objection handlers, case studies, and mined pain points.
CREATE TABLE IF NOT EXISTS kb_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL,                       -- 'objection' | 'case_study' | 'pain_point'
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  embedding vector(384),                    -- fastembed bge-small-en-v1.5 / hashing fallback
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kb_documents_embedding_idx
  ON kb_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Server-only table: enable RLS with NO policies so anon/authenticated clients are denied.
-- The backend uses the service-role key, which bypasses RLS, so retrieval/ingest still work.
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;

-- Similarity search RPC used by app/rag/store.py::retrieve().
CREATE OR REPLACE FUNCTION match_kb_documents(
  query_embedding vector(384),
  match_count int DEFAULT 4,
  filter_kind text DEFAULT NULL
)
RETURNS TABLE (id uuid, kind text, content text, metadata jsonb, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT d.id, d.kind, d.content, d.metadata,
         1 - (d.embedding <=> query_embedding) AS similarity
  FROM kb_documents d
  WHERE filter_kind IS NULL OR d.kind = filter_kind
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;
