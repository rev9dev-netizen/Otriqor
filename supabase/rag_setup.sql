-- Enable pgvector extension to work with embeddings
create extension if not exists vector;

-- 1. Files Table: Metadata for uploaded documents
create table if not exists files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid, -- Can be null for public/anonymous, or linked to auth.users
  name text not null,
  type text not null, -- mime type
  size bigint not null,
  path text not null, -- Supabase Storage path
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Document Sections: Stores chunks and their embeddings
create table if not exists document_sections (
  id uuid default gen_random_uuid() primary key,
  file_id uuid references files(id) on delete cascade not null,
  content text not null, -- The actual text chunk
  token_count int,       
  embedding vector(1024) -- Mistral Embeddings have 1024 dimensions
);

-- Index for faster similarity search
create index if not exists document_sections_embedding_idx 
on document_sections 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 3. Match Documents Function: Performs similarity search
create or replace function match_documents (
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  filter_file_ids uuid[] default null
)
returns table (
  id uuid,
  content text,
  similarity float,
  file_id uuid
)
language plpgsql
as $$
begin
  return query(
    select
      document_sections.id,
      document_sections.content,
      1 - (document_sections.embedding <=> query_embedding) as similarity,
      document_sections.file_id
    from document_sections
    where 1 - (document_sections.embedding <=> query_embedding) > match_threshold
    and (filter_file_ids is null or document_sections.file_id = any(filter_file_ids))
    order by document_sections.embedding <=> query_embedding
    limit match_count
  );
end;
$$;
