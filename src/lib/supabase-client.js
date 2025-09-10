import { createClient } from '@supabase/supabase-js'

// Hardcode the values temporarily to test
const supabaseUrl = 'https://lysaghtone.com/'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU2NjgxMjkxLCJleHAiOjIwNzIyNTcyOTF9.K9TQ3pH-FP8ejqSkW_aFaYiDv5RNqfcLCwTdae6on04'

console.log(' Hardcoded Supabase URL:', supabaseUrl)
console.log(' Hardcoded Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)