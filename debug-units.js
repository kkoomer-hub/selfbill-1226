
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tiahterdoewmspoiiqoi.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYWh0ZXJkb2V3bXNwb2lpcW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTU4MTYsImV4cCI6MjA4MTUzMTgxNn0.HnomX8yM5MewS8rjFZcdrk6z-JikoouNsdnbU-lp9O4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log("--- Buildings ---");
  const { data: buildings, error: bErr } = await supabase.from('buildings').select('*');
  if (bErr) console.error(bErr);
  else console.log(JSON.stringify(buildings, null, 2));

  console.log("\n--- Units ---");
  const { data: units, error: uErr } = await supabase.from('units').select('*');
  if (uErr) console.error(uErr);
  else console.log(JSON.stringify(units, null, 2));

  console.log("\n--- Members ---");
  const { data: members, error: mErr } = await supabase.from('building_members').select('*');
  if (mErr) console.error(mErr);
  else console.log(JSON.stringify(members, null, 2));
}

checkData();
