# Elevate University Belt

A modern, mobile-first church youth website built with Next.js and Supabase.

## Features

- Announcements with cover images, categories, and pin support
- Photo gallery organized by albums
- Video section (YouTube & Facebook embeds)
- Prayer wall with community prayer counts and admin replies
- Role-based auth (User / Admin)
- Admin dashboard for managing all content

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database & Auth:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Language:** TypeScript

## Getting Started

1. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials.
2. Run the SQL schema in your Supabase SQL Editor.
3. Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
