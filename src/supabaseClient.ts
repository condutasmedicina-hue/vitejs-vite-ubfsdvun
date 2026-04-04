import { createClient } from '@supabase/supabase-js';

// Usamos a própria URL do seu site + o túnel que criamos no vercel.json
const proxyUrl = `${window.location.origin}/proxy-db`;

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5a2hpamh6cXR2aGhybXhvaHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMDUxMzMsImV4cCI6MjA4Mjc4MTEzM30.nXuDp5PYFQxHewal0caQF4FVRZiFN8bgedHuK87YneY';

export const supabase = createClient(proxyUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    // Desliga a tentativa de usar WebSockets (ajuda a passar em firewalls rígidos)
    params: {
      eventsPerSecond: 2
    }
  }
});