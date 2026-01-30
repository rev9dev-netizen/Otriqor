-- Add citations column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS citations JSONB;

-- Comment: This allows storing search results or tool outputs directly on the assistant message
-- instead of creating separate tool messages.
