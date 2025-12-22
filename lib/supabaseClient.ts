
import { createClient } from '@supabase/supabase-js';

// ВАЖНО: Замените эти значения на свои из панели управления Supabase (Project Settings -> API)
// Если ключи не заданы, приложение будет работать в режиме Mock Data (демо-режим)
const SUPABASE_URL = 'https://yrlxygbsmfndcfntdmon.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybHh5Z2JzbWZuZGNmbnRkbW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjY3ODMsImV4cCI6MjA3OTIwMjc4M30.D6zrwrvHuIivRGM7nedRsJ2idh_TBmWs3AYCnpBeEV0'; 

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;
