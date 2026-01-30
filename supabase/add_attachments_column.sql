alter table messages 
add column if not exists attachments jsonb;
