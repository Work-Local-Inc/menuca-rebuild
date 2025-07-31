const { createClient } = require('@supabase/supabase-js');

console.log('Testing minimal Supabase client creation...');

const supabaseUrl = 'https://fsjodpnptdbwaigzkmfl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzam9kcG5wdGRid2FpZ3prbWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDM2MDQsImV4cCI6MjA2OTQ3OTYwNH0.lcy6gDS58IhiWOTPhNOH6EiUTFmSDvIbX-uiZmCDqjQ';

console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);
console.log('Key length:', supabaseAnonKey.length);
console.log('Key type:', typeof supabaseAnonKey);

try {
  console.log('Creating Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('SUCCESS: Supabase client created');
  console.log('Client object keys:', Object.keys(supabase));
} catch (error) {
  console.log('ERROR creating Supabase client:', error.message);
  console.log('Error stack:', error.stack);
}