-- Add status column to profiling_surveys table
-- This replaces the simple is_active boolean with a more flexible status system

-- Add the status column
ALTER TABLE public.profiling_surveys 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'live' CHECK (status IN ('live', 'paused', 'archived'));

-- Update existing records to have 'live' status if they are active, 'paused' if not
UPDATE public.profiling_surveys 
SET status = CASE 
  WHEN is_active = true THEN 'live'
  ELSE 'paused'
END
WHERE status IS NULL;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_profiling_surveys_status ON profiling_surveys(status);

-- Update the existing index to be more specific
DROP INDEX IF EXISTS idx_profiling_surveys_active;
CREATE INDEX idx_profiling_surveys_live ON profiling_surveys(status) WHERE status = 'live';

-- Add comment for documentation
COMMENT ON COLUMN profiling_surveys.status IS 'Survey status: live (visible to users), paused (hidden but can be resumed), archived (permanently hidden)';
