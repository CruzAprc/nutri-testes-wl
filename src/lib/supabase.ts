import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nibzlpxnwzufowssyaso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYnpscHhud3p1Zm93c3N5YXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTk3ODUsImV4cCI6MjA4MDEzNTc4NX0.-hPVsLH5t_edtIDillcE7XXYq9RU0khwe3LMj0cuHvk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
