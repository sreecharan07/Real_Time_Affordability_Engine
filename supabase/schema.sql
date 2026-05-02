-- AffordIQ — Database Schema
-- Run this in your Supabase SQL Editor to set up all tables
-- https://app.supabase.com → SQL Editor

-- ============================================================
-- Table: financial_profiles
-- Stores the user's core financial configuration
-- ============================================================
create table if not exists financial_profiles (
  id            serial primary key,
  monthly_income  numeric       not null,
  current_balance numeric       not null,
  savings_goal    numeric       default 250,
  safety_buffer   numeric       default 300,
  payday_date     integer       default 1,   -- day of month (1-31)
  created_at      timestamptz   default now()
);

-- ============================================================
-- Table: bills
-- Fixed monthly expenses with due dates
-- ============================================================
create table if not exists bills (
  id           serial primary key,
  name         text      not null,
  amount       numeric   not null,
  due_day      integer   not null,   -- day of month (1-31)
  category     text      default 'other',
  is_recurring boolean   default true,
  created_at   timestamptz default now()
);

-- Valid categories: rent, utilities, insurance, phone, internet,
--                   groceries, transport, credit_card, other

-- ============================================================
-- Table: subscriptions
-- Recurring subscription services
-- ============================================================
create table if not exists subscriptions (
  id            serial primary key,
  name          text      not null,
  amount        numeric   not null,
  billing_cycle text      default 'monthly',  -- monthly | annual | weekly
  category      text      default 'other',
  created_at    timestamptz default now()
);

-- Valid categories: streaming, music, fitness, software, news, gaming, other

-- ============================================================
-- Table: affordability_checks
-- Log of every affordability check run by the user
-- ============================================================
create table if not exists affordability_checks (
  id                serial primary key,
  purchase_amount   numeric   not null,
  category          text,
  merchant_name     text,
  purchase_date     text,
  decision          text      not null,   -- SAFE | RISKY | NOT_RECOMMENDED
  score             integer,              -- 0-100
  projected_balance numeric,
  disposable_balance numeric,
  reasons           jsonb,               -- array of reason code strings
  recommendation    text,
  created_at        timestamptz default now()
);

-- ============================================================
-- Demo seed data (optional — matches the app defaults)
-- ============================================================
insert into financial_profiles (monthly_income, current_balance, savings_goal, safety_buffer, payday_date)
values (3200, 1850, 250, 300, 1);

insert into bills (name, amount, due_day, category, is_recurring) values
  ('Rent',              950,  1,  'rent',        true),
  ('Phone Bill',         65,  15, 'phone',        true),
  ('Internet',           45,  18, 'internet',     true),
  ('Groceries',         300,  10, 'groceries',    true),
  ('Car Insurance',     120,  20, 'insurance',    true),
  ('Hydro / Utilities',  85,  25, 'utilities',    true),
  ('Credit Card Min.',   75,  22, 'credit_card',  true);

insert into subscriptions (name, amount, billing_cycle, category) values
  ('Netflix',         17.99, 'monthly', 'streaming'),
  ('Spotify',         10.99, 'monthly', 'music'),
  ('Gym',             24.99, 'monthly', 'fitness'),
  ('iCloud',           3.99, 'monthly', 'software'),
  ('YouTube Premium', 13.99, 'monthly', 'streaming');
