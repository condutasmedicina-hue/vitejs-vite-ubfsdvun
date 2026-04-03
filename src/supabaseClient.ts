import { createClient } from '@supabase/supabase-js';

// URL extraída diretamente da sua chave
const supabaseUrl = 'https://iykhijhzqtvhhrmxohys.supabase.co';

// Chave Anon que você acabou de enviar
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5a2hpamh6cXR2aGhybXhvaHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMDUxMzMsImV4cCI6MjA4Mjc4MTEzM30.nXuDp5PYFQxHewal0caQF4FVRZiFN8bgedHuK87YneY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);