-- Add branching columns to the chats table
ALTER TABLE chats 
ADD COLUMN branched_from_chat_id UUID REFERENCES chats(id),
ADD COLUMN branched_from_message_id UUID REFERENCES messages(id);

-- Optional: Add an index to speed up lookups
CREATE INDEX idx_chats_branched_from ON chats(branched_from_chat_id);
