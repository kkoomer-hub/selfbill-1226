-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Buildings (공동주택 정보)
create table if not exists public.buildings (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  address_detail text,
  planned_units_count numeric, -- 계획된 전체 세대 수
  building_units_count numeric, -- 실제 등록된 활성 세대 수
  billing_method text, -- '균등 배분' or '지분율에 의거 부과'
  billing_period_type text,
  billing_period_start numeric,
  billing_period_end numeric,
  billing_due_day numeric,
  late_fee_rate_percent numeric,
  bank_name text,
  bank_account text,
  bank_holder text,
  billing_monthly_fee_krw numeric,
  selfbill_plan_confirmed_at timestamptz,
  selfbill_auto_bank_name text,
  selfbill_auto_bank_account text,
  selfbill_auto_bank_holder text,
  selfbill_auto_start_date date,
  setup_step numeric default 1,
  status text default 'draft', -- draft, active, inactive
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Units (세대 정보)
create table if not exists public.units (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade not null,
  dong text,
  ho text,
  floor text,
  unit_name text, -- 동/호수 표시 텍스트
  tenant_name text, -- 입주자 이름 (required in Entity but allows null in DB initially)
  tenant_phone text, -- 입주자 휴대폰
  tenant_email text,
  is_owner boolean default false,
  residents_count numeric default 0,
  move_in_date date,
  car_count numeric default 0,
  car_numbers text[], -- 차량 번호 목록
  share_ratio numeric,
  needs_review boolean default false,
  status text default 'active', -- active, inactive
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. BuildingMembers (멤버/사용자 연결)
create table if not exists public.building_members (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  role text, -- '대표자' (representative) or '입주자' (tenant)
  unit_id uuid references public.units(id) on delete set null,
  is_primary_representative boolean default false,
  status text default 'invited', -- 초대중(invited), 활성(active), 탈퇴(left)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. BillCycles (청구 월/회차)
create table if not exists public.bill_cycles (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade not null,
  year numeric not null,
  month numeric not null,
  year_month text, -- 'YYYY-MM'
  due_date date,
  period_start date,
  period_end date,
  status text default 'draft', -- draft, confirmed, sent
  is_locked boolean default false,
  first_sent_at timestamptz,
  total_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. BillItemTemplates (청구 항목 템플릿 - 고정/변동 설정)
create table if not exists public.bill_item_templates (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade not null,
  name text not null,
  category text, -- 일반, 수선, 기타
  amount_type text, -- 고정, 변동
  default_amount numeric default 0,
  default_months numeric[], -- 적용 월 [1,2,...]
  default_type text, -- 공용, 세대별
  default_target_unit_ids uuid[], -- 세대별일 경우 대상 ID 목록
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. BillItems (실제 청구 항목)
create table if not exists public.bill_items (
  id uuid primary key default uuid_generate_v4(),
  bill_cycle_id uuid references public.bill_cycles(id) on delete cascade not null,
  building_id uuid references public.buildings(id) on delete cascade not null,
  template_id uuid references public.bill_item_templates(id) on delete set null,
  name text not null,
  category text,
  amount_total numeric default 0,
  allocation_method text, -- 균등분배, 면적비례, 세대별차등, 직접입력
  type text, -- 공용, 세대별
  target_unit_ids uuid[], -- 대상 세대 ID 목록
  unit_amounts jsonb, -- 세대별 금액 { "unit_id": amount }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. UnitCharges (세대별 청구서)
create table if not exists public.unit_charges (
  id uuid primary key default uuid_generate_v4(),
  bill_cycle_id uuid references public.bill_cycles(id) on delete cascade not null,
  building_id uuid references public.buildings(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete cascade not null,
  year_month text,
  amount_total numeric default 0,
  breakdown_json jsonb, -- 항목별 내역 상세
  late_fee_amount numeric default 0,
  after_due_amount numeric default 0,
  is_sent boolean default false,
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. PaymentStatuses (납부 현황)
create table if not exists public.payment_statuses (
  id uuid primary key default uuid_generate_v4(),
  unit_charge_id uuid references public.unit_charges(id) on delete cascade not null,
  building_id uuid references public.buildings(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete cascade not null,
  year_month text not null,
  status text default '미납', -- 미납, 부분납, 완납
  charged_amount numeric default 0,
  paid_amount numeric default 0,
  paid_at timestamptz,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. Invitations (초대 링크 관리)
create table if not exists public.invitations (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete cascade,
  tenant_name text not null,
  tenant_phone text not null,
  status text default '초대 전', -- 초대 전, 초대 발송, 가입 완료
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. RoleChangeRequests (대표자 권한 위임 요청)
create table if not exists public.role_change_requests (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade not null,
  from_user_id uuid references auth.users(id),
  to_user_id uuid references auth.users(id),
  status text default '요청', -- 요청, 예비대표 수락, 거절, 취소
  requested_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 11. NotificationLogs (알림 발송 로그)
create table if not exists public.notification_logs (
  id uuid primary key default uuid_generate_v4(),
  building_id uuid references public.buildings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  to_phone text not null,
  channel text, -- MMS, KAKAO etc
  event_type text, -- INVITATION, BILL_NOTICE, etc
  event_ref_id text,
  title text,
  body text,
  status text, -- 발송대기, 발송성공, 발송실패
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
