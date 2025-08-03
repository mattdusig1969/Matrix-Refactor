# Earnly - Survey Rewards Platform

A modern survey rewards platform built with Next.js 14, TypeScript, and Supabase. Users can register, complete surveys, and earn real rewards.

## 🚀 Features

- **User Authentication**: Mobile-first registration with email fallback
- **Smart Survey Matching**: Surveys matched to user profiles and targeting
- **Instant Rewards**: $5 signup bonus + earnings from completed surveys
- **Profile System**: Comprehensive profiling surveys for better targeting
- **Dashboard**: Clean interface for survey management and earnings tracking
- **Reward System**: Multiple payout options (PayPal, Gift Cards, Bank Transfer)

## 🏗️ Project Structure

```
survey-rewards-site/
├── src/
│   ├── app/
│   │   ├── dashboard/          # User dashboard after login
│   │   ├── globals.css         # Global styles with Tailwind
│   │   ├── layout.tsx          # Root layout component
│   │   └── page.tsx            # Landing/auth page
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client configuration
│   │   └── utils.ts            # Utility functions
│   └── components/             # Reusable UI components (coming soon)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **UI Components**: Lucide React icons, React Hot Toast
- **Deployment**: Vercel-ready configuration

## 📋 Database Schema

### New Tables Required:

1. **panelists** - User accounts and personal info
2. **profiling_surveys** - Survey templates for user profiling  
3. **panelist_profiles** - Completed profile survey responses
4. **country** (modified) - Added languages JSON field

See the SQL statements in the project documentation for complete schema setup.

## 🚀 Getting Started

1. **Clone and setup:**
   ```bash
   cd survey-rewards-site
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.local.example .env.local
   # Add your Supabase URL and anon key
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Visit:** http://localhost:3001

## 🗃️ Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Create panelists table
create table public.panelists (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  first_name text,
  last_name text,
  mobile text unique,
  email text unique,
  password_hash text,
  country_id uuid references country(id),
  language text,
  is_verified boolean default false,
  last_login timestamp with time zone
);

-- Create profiling_surveys table
create table public.profiling_surveys (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  name text,
  description text,
  is_active boolean default true
);

-- Create panelist_profiles table
create table public.panelist_profiles (
  id uuid primary key default uuid_generate_v4(),
  panelist_id uuid references panelists(id),
  profiling_survey_id uuid references profiling_surveys(id),
  completed_at timestamp with time zone,
  data jsonb
);

-- Add languages to country table
alter table country add column languages jsonb;

-- Enable RLS
alter table panelists enable row level security;
alter table panelist_profiles enable row level security;

-- RLS Policies
create policy "Panelist can access own record"
on panelists for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Panelist can access own profiles"
on panelist_profiles for all
using (auth.uid() = panelist_id)
with check (auth.uid() = panelist_id);
```

## 🎨 Brand Names Considered

- **Earnly** ⭐ (Current choice)
- PulsePoints
- RewardLoop
- SurveyMint
- ProfilePerks
- TapRewards
- OpinionCash
- Match & Earn
- FastFive
- EarnIQ

## 📱 User Flow

1. **Landing Page** - Combined login/register with mobile-first design
2. **Registration** - Collect basic info + $5 signup incentive
3. **Profile Completion** - Profiling surveys for better targeting
4. **Dashboard** - Available surveys, earnings, profile management
5. **Survey Taking** - Matched surveys based on user profile
6. **Rewards** - Multiple payout options and earnings tracking

## 🔧 Admin Panel Integration

The main Matrix admin will include a new "Panel" section with:
- **Panelists** - User management
- **Profiling Surveys** - Survey template management  
- **Reports** - Analytics and payout tracking

## 🚀 Deployment

This project is configured for Vercel deployment:

1. Push to your repository
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically on push

## 🤝 Contributing

This is part of the Matrix survey platform ecosystem. Follow existing code patterns and maintain consistency with the main application.
