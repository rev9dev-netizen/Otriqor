-- 1. Create the 'files' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('files', 'files', true)
on conflict (id) do nothing;

-- 2. Allow Public Access (for MVP simplicity, or restrict to auth if preferred)
-- Policy for INSERT (Uploads)
create policy "Allow public uploads"
on storage.objects for insert
with check ( bucket_id = 'files' );

-- Policy for SELECT (Downloads/Previews)
create policy "Allow public downloads"
on storage.objects for select
using ( bucket_id = 'files' );
