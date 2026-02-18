import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://ltddgjgneqwtpawlmfsf.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjJjNTJkZjg4LWUwZmQtNGMwNi1iN2Y3LWM0MjkwMWRjMzAxZCJ9.eyJwcm9qZWN0SWQiOiJsdGRkZ2pnbmVxd3RwYXdsbWZzZiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzcwODQxNDg0LCJleHAiOjIwODYyMDE0ODQsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.cvr2Oq3xf6tqpC_xZcuDlHfgGv5S8mdLXtR8MIyDlTM';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };