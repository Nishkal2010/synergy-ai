import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://onpksbdmwywkekuinykx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucGtzYmRtd3l3a2VrdWlueWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NTQzMDIsImV4cCI6MjA4MTMzMDMwMn0.3l6Gg3zLmk6WN-Bs4ONtuu-3gvcWXjc-Hg7tk6j07SQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
