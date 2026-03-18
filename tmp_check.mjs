import { createClient } from '@supabase/supabase-js'
const s = createClient(
  'https://nlbetqmmossvdxaqimjr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sYmV0cW1tb3NzdmR4YXFpbWpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzYxNzMsImV4cCI6MjA4ODk1MjE3M30.ulvchldEmQrYMmd8sKHynDt4A7Xydg4lOiYe2DVfhLg'
)
const { data } = await s.from('profiles').select('id, plan, email')
console.log(JSON.stringify(data, null, 2))
