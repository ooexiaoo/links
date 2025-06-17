-- Create a function to increment link clicks and update last_clicked_at
create or replace function increment_link_clicks(link_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.links
  set 
    clicks = coalesce(clicks, 0) + 1,
    updated_at = now()
  where id = link_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function increment_link_clicks(uuid) to authenticated;
