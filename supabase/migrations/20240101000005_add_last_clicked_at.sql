-- Add last_clicked_at column to links table
alter table public.links
add column if not exists last_clicked_at timestamp with time zone;

-- Update the increment_link_clicks function to set last_clicked_at
create or replace function increment_link_clicks(link_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.links
  set 
    clicks = coalesce(clicks, 0) + 1,
    updated_at = now(),
    last_clicked_at = now()
  where id = link_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function increment_link_clicks(uuid) to authenticated;
