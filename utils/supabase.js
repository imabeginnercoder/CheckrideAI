import { createClient } from '@supabase/supabase-js'

// Grab the secret keys from your .env.local vault
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Build and export the connection "client"
export const supabase = createClient(supabaseUrl, supabaseAnonKey)