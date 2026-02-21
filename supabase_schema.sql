
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- WARNING: This will delete existing data in these tables.
-- We drop the tables first to ensure the schema matches exactly what the app expects.
drop table if exists public.chapters;
drop table if exists public.books;

-- Books Table
create table public.books (
  id uuid default uuid_generate_v4() primary key,
  title text,
  subtitle text,
  description text, -- The AI generated description of the book
  back_cover_copy text,
  
  -- User Inputs
  topic text not null,
  target_audience text,
  english_style text, -- New field
  page_count text,
  target_chapter_count integer,
  tone text,
  author_name text,
  objective text,
  user_book_description text, -- The user's input description
  extras jsonb default '[]'::jsonb,
  
  status text default 'draft', -- 'draft', 'generating', 'completed', 'error'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chapters Table
create table public.chapters (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references public.books(id) on delete cascade not null,
  title text not null,
  description text,
  content text, -- The full markdown content
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.books enable row level security;
alter table public.chapters enable row level security;

-- Create policies (for development/demo purposes, we'll allow public access)
create policy "Allow public select" on public.books for select using (true);
create policy "Allow public insert" on public.books for insert with check (true);
create policy "Allow public update" on public.books for update using (true);
create policy "Allow public delete" on public.books for delete using (true);

create policy "Allow public select" on public.chapters for select using (true);
create policy "Allow public insert" on public.chapters for insert with check (true);
create policy "Allow public update" on public.chapters for update using (true);
create policy "Allow public delete" on public.chapters for delete using (true);
