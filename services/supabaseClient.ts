import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dckligennuqxpjzjzcla.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRja2xpZ2VubnVxeHBqemp6Y2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDE2NDQsImV4cCI6MjA3MDMxNzY0NH0.hf4XDQT7x8ZyHaiYzbcQqKLSn91nEPtKKQGv80NQRac";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
