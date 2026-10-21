import { createClient } from '@supabase/supabase-js'

// Só no servidor: usa a service key (RLS ligado, sem policy pública).
export const supabase = () => {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Preencha SUPABASE_URL e SUPABASE_SERVICE_KEY no .env.local e reinicie o servidor.')
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
}
