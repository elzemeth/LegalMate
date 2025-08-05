create extension if not exists vector;

create table if not exists law_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb not null,
  embedding vector(768),
  created_at timestamp with time zone default now()
);

create index if not exists law_chunks_embedding_idx 
on law_chunks using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create or replace function match_law_chunks(
  query_embedding vector(768),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    law_chunks.id,
    law_chunks.content,
    law_chunks.metadata,
    1 - (law_chunks.embedding <=> query_embedding) as similarity
  from law_chunks
  where 1 - (law_chunks.embedding <=> query_embedding) > match_threshold
  order by law_chunks.embedding <=> query_embedding
  limit match_count;
$$;

alter table law_chunks enable row level security;

create or replace function get_law_stats()
returns table (
  kanun_adi text,
  madde_no text
)
language sql stable
as $$
  select distinct
    metadata->>'kanun_adi' as kanun_adi,
    metadata->>'madde_no' as madde_no
  from law_chunks
  where metadata->>'kanun_adi' is not null 
    and metadata->>'madde_no' is not null;
$$;

create policy "Allow public read access to law_chunks" 
on law_chunks for select 
using (true);

create policy "Allow service role full access to law_chunks" 
on law_chunks for all 
to service_role 
using (true) 
with check (true);
