-- Add missing columns to links table
alter table public.links
add column if not exists is_monetized boolean default false,
add column if not exists is_active boolean default true,
add column if not exists title text,
add column if not exists description text;

-- No need to migrate data from old monetized column as it doesn't exist

-- Update the create_link function to use the new column names
create or replace function public.create_link(
  original_url text,
  custom_slug text default null,
  expires_at timestamp with time zone default null,
  is_monetized boolean default false,
  title text default null,
  description text default null
) returns json as $$
declare
  new_slug text;
  link_id uuid;
  result json;
begin
  -- Generate a random slug if not provided
  if custom_slug is null or custom_slug = '' then
    -- Keep generating slugs until we find an available one
    loop
      new_slug := public.generate_slug();
      exit when not exists (select 1 from public.links where slug = new_slug);
    end loop;
  else
    -- Use the provided slug, but check if it's available
    if exists (select 1 from public.links where slug = custom_slug) then
      raise exception 'Slug already in use';
    end if;
    new_slug := custom_slug;
  end if;

  -- Insert the new link with all fields
  insert into public.links (
    user_id,
    original_url,
    slug,
    expires_at,
    is_monetized,
    is_active,
    title,
    description
  ) values (
    auth.uid(),
    original_url,
    new_slug,
    expires_at,
    is_monetized,
    true, -- is_active is always true for new links
    title,
    description
  )
  returning id into link_id;

  -- Return the created link
  select to_json(link_data) into result
  from (
    select * from public.links where id = link_id
  ) as link_data;

  return result;
end;
$$ language plpgsql security definer;
