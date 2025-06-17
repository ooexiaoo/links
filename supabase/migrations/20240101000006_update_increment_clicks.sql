-- First drop the existing function if it exists
drop function if exists increment_link_clicks(uuid);

-- Then create the function with the new return type
create or replace function increment_link_clicks(link_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  link_exists boolean;
  updated_count integer;
begin
  -- Check if link exists
  select exists(select 1 from public.links where id = link_id) into link_exists;
  
  if not link_exists then
    return jsonb_build_object('error', 'Link not found');
  end if;
  
  -- Update the link and get the number of rows updated
  update public.links
  set 
    clicks = coalesce(clicks, 0) + 1,
    updated_at = now(),
    last_clicked_at = now()
  where id = link_id
  returning 1 into updated_count;
  
  -- Return success with the number of updated rows
  return jsonb_build_object('success', true, 'updated_rows', updated_count);
  
exception when others then
  return jsonb_build_object('error', SQLERRM);
end;
$$;

-- Update the function comment
comment on function increment_link_clicks is 'Increments the click counter for a link and updates the last_clicked_at timestamp';

-- Ensure the function is executable by authenticated users
grant execute on function increment_link_clicks(uuid) to authenticated;
