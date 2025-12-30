
-- Enable RLS on core tables (if not already enabled)
alter table units enable row level security;
alter table building_members enable row level security;
alter table buildings enable row level security;
alter table bill_item_templates enable row level security;
alter table bill_cycles enable row level security;
alter table unit_charges enable row level security;
alter table payment_statuses enable row level security;

-- Drop existing policies to avoid conflicts (optional but safer)
drop policy if exists "Enable read access for authenticated users" on units;
drop policy if exists "Enable insert access for authenticated users" on units;
drop policy if exists "Enable update access for authenticated users" on units;
drop policy if exists "Enable delete access for authenticated users" on units;

-- Create permissive policies for authenticated users
-- (Note: In a production app, you might want stricter policies checking building_members)

-- 1. Units
create policy "Enable access for authenticated users" on units
for all
to authenticated
using (true)
with check (true);

-- 2. Building Members
create policy "Enable access for authenticated users" on building_members
for all
to authenticated
using (true)
with check (true);

-- 3. Buildings
create policy "Enable access for authenticated users" on buildings
for all
to authenticated
using (true)
with check (true);

-- 4. Bill Item Templates
create policy "Enable access for authenticated users" on bill_item_templates
for all
to authenticated
using (true)
with check (true);

-- 5. Bill Cycles
create policy "Enable access for authenticated users" on bill_cycles
for all
to authenticated
using (true)
with check (true);

-- 6. Unit Charges
create policy "Enable access for authenticated users" on unit_charges
for all
to authenticated
using (true)
with check (true);

-- 7. Payment Statuses
create policy "Enable access for authenticated users" on payment_statuses
for all
to authenticated
using (true)
with check (true);
