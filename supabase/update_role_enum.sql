-- Update the check constraint for the role column in the messages table
-- First, drop the existing check constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_role_check;

-- Re-add the check constraint with 'tool' included
ALTER TABLE messages ADD CONSTRAINT messages_role_check 
    CHECK (role IN ('user', 'assistant', 'system', 'tool'));

-- Comment: This allows the backend to save tool output messages directly
-- used for citations and search results.
