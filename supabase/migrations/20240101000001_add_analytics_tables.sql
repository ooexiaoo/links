-- Create profiles table to store user metadata (including premium status)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null,
  is_premium boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint profiles_pkey primary key (id)
) tablespace pg_default;

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Users can view their own profile"
on profiles for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on profiles for update
using (auth.uid() = id);

-- Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, is_premium, created_at, updated_at)
  values (new.id, false, now(), now());
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signups
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create link_analytics table
create table if not exists public.link_analytics (
  id uuid default uuid_generate_v4() primary key,
  link_id uuid references public.links(id) on delete cascade not null,
  clicked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ip_address inet,
  country varchar(2),
  device_type varchar(50),
  referrer text,
  user_agent text
) tablespace pg_default;

-- Create index for faster lookups
create index if not exists idx_link_analytics_link_id on public.link_analytics(link_id);
create index if not exists idx_link_analytics_clicked_at on public.link_analytics(clicked_at);

-- Enable RLS on link_analytics
alter table public.link_analytics enable row level security;

-- Create policies for link_analytics
create policy "Users can view analytics for their own links"
on link_analytics for select
using (
  exists (
    select 1 from public.links
    where links.id = link_analytics.link_id
    and links.user_id = auth.uid()
  )
);

-- Add a function to log analytics
create or replace function public.log_link_click(
  p_link_id uuid,
  p_ip_address inet default null,
  p_country varchar(2) default null,
  p_device_type varchar(50) default null,
  p_referrer text default null,
  p_user_agent text default null
) returns void as $$
begin
  insert into public.link_analytics (
    link_id, ip_address, country, device_type, referrer, user_agent
  ) values (
    p_link_id, p_ip_address, p_country, p_device_type, p_referrer, p_user_agent
  );
end;
$$ language plpgsql security definer;
