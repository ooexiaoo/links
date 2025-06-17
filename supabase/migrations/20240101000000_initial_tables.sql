-- Create the links table
create table if not exists public.links (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  original_url text not null,
  slug text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  monetized boolean default false,
  clicks integer default 0
) tablespace pg_default;

-- Create index for faster lookups
create index if not exists idx_links_user_id on public.links(user_id);
create index if not exists idx_links_slug on public.links(slug);

-- Enable Row Level Security
alter table public.links enable row level security;

-- Create policies for links
create policy "Users can view their own links"
on public.links for select
using (auth.uid() = user_id);

create policy "Users can insert their own links"
on public.links for insert
with check (auth.uid() = user_id);

create policy "Users can update their own links"
on public.links for update
using (auth.uid() = user_id);

create policy "Users can delete their own links"
on public.links for delete
using (auth.uid() = user_id);
