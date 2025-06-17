-- Create a function to generate a random slug if not provided
create or replace function public.generate_slug()
returns text as $$
declare
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer := 0;
  rand_int integer;
begin
  for i in 1..8 loop
    rand_int := floor(random() * length(chars) + 1)::integer;
    result := result || substr(chars, rand_int, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- Create a function to handle link creation
create or replace function public.create_link(
  original_url text,
  custom_slug text default null,
  expires_at timestamp with time zone default null,
  monetized boolean default false
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

  -- Insert the new link
  insert into public.links (
    user_id,
    original_url,
    slug,
    expires_at,
    monetized
  ) values (
    auth.uid(),
    original_url,
    new_slug,
    expires_at,
    monetized
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
