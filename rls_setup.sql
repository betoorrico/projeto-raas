-- Enable Row Level Security on the table (if not already enabled)
ALTER TABLE respostas_rag ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone (anon and authenticated) to SELECT (read) data
-- IF NOT EXISTS is not standard SQL for policies in all versions, so we use a DROP command first to avoid conflicts if re-running.
DROP POLICY IF EXISTS "Public Read Access" ON respostas_rag;

CREATE POLICY "Public Read Access"
ON respostas_rag
FOR SELECT
TO anon, authenticated
USING (true);

-- Explanation:
-- 1. We enable RLS to ensure security rules are active.
-- 2. We allow the 'anon' (public) and 'authenticated' roles to perform SELECT operations.
-- 3. 'USING (true)' means all rows are visible. If you wanted to restrict rows, you'd put a condition here.
