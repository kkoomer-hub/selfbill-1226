
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tiahterdoewmspoiiqoi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYWh0ZXJkb2V3bXNwb2lpcW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTU4MTYsImV4cCI6MjA4MTUzMTgxNn0.HnomX8yM5MewS8rjFZcdrk6z-JikoouNsdnbU-lp9O4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFilter() {
  const buildingId = 'e0627e58-e999-4c83-bd9c-0035be964a6f'; // 행복빌라
  console.log(`Testing filtering for buildingId: ${buildingId}`);

  let builder = supabase.from('units').select('*');
  builder = builder.eq('building_id', buildingId);
  
  const { data, error } = await builder;
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Found ${data.length} units.`);
    console.log(JSON.stringify(data, null, 2));
  }
}

verifyFilter();
