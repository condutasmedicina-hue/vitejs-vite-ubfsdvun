import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iykhijhzqtvhhrmxohys.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5a2hpamh6cXR2aGhybXhvaHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMDUxMzMsImV4cCI6MjA4Mjc4MTEzM30.nXuDp5PYFQxHewal0caQF4FVRZiFN8bgedHuK87YneY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
