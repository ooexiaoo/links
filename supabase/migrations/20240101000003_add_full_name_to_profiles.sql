-- Add full_name column to profiles table
alter table public.profiles
add column if not exists full_name text;

-- Update the handle_new_user function to include full_name
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, is_premium, full_name, created_at, updated_at)
  values (new.id, false, new.raw_user_meta_data->>'full_name', now(), now());
  return new;
end;
$$ language plpgsql security definer;

-- Update existing profiles with empty full_name if null
update public.profiles
set full_name = ''
where full_name is null;
