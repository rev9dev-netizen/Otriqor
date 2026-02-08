-- Add connector_actions table for caching Klavis connector actions
CREATE TABLE IF NOT EXISTS public.connector_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name TEXT NOT NULL,
    action_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    input_schema JSONB NOT NULL,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(integration_name, action_name)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_connector_actions_integration ON public.connector_actions(integration_name);
CREATE INDEX IF NOT EXISTS idx_connector_actions_category ON public.connector_actions(category);
CREATE INDEX IF NOT EXISTS idx_connector_actions_cached_at ON public.connector_actions(cached_at);

-- Enable RLS (actions are public, but we can add policies later if needed)
ALTER TABLE public.connector_actions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read connector actions
CREATE POLICY "Authenticated users can view connector actions"
    ON public.connector_actions
    FOR SELECT
    TO authenticated
    USING (true);

-- Only service role can insert/update/delete (managed by server actions)
CREATE POLICY "Service role can manage connector actions"
    ON public.connector_actions
    FOR ALL
    TO service_role
    USING (true);
