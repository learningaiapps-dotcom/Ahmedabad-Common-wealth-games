import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// If the keys are missing the app still opens, but forms show "Database is not connected yet".
export const supabase = url && key ? createClient(url, key) : null
