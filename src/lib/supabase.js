import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase client — null if env vars are not configured.
// The RegretArchive component handles the null case gracefully.
const supabase =
  url && key && !url.includes('your-project-id')
    ? createClient(url, key)
    : null;

export { supabase };

/*
  SQL to run in your Supabase SQL editor to create the required table:

  CREATE TABLE regret_archive (
    id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    text       TEXT NOT NULL CHECK (char_length(text) <= 280),
    scene      INTEGER CHECK (scene IN (1, 2)),
    created_at TIMESTAMPTZ DEFAULT now()
  );

  ALTER TABLE regret_archive ENABLE ROW LEVEL SECURITY;

  -- Allow anonymous inserts and reads
  CREATE POLICY "anon insert" ON regret_archive FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY "anon select" ON regret_archive FOR SELECT TO anon USING (true);
*/
