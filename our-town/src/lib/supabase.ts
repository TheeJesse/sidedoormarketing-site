import { createClient } from '@supabase/supabase-js'

// Server-side admin client — uses service role key, never exposed to browser
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
