# Wavelength

A mobile-first social platform for spontaneous campus connections. Anti-performative design with no likes or followers.

## Features

- **Widget-Based Profiles**: Build your profile with text and image widgets in a Pinterest-style masonry layout
- **Daily Prompts**: Engage with daily questions and see others' responses
- **Interest-Based Matching**: Get matched with people who share your interests (3+ shared interests = match)
- **Anonymous Feed**: Usernames are hidden by default - tap to reveal
- **Repost System**: Share content you resonate with to your profile

## Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Realtime)
- **AI**: Mock interest extraction (OpenAI integration ready)
- **Animations**: Framer Motion

## Design System

- **Background**: Light beige/cream `#F5F5DC`
- **Accent**: Zoom blue `#2D8CFF`
- **Style**: Minimalist, iOS-inspired, mobile-first

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project settings under "API".

### 3. Set Up Database

1. Go to SQL Editor in your Supabase dashboard
2. Run the schema file: `supabase/schema.sql`
3. Run the seed file: `supabase/seed.sql`

### 4. Configure Storage Buckets

In Supabase Storage, create two public buckets:

1. `avatars` - For user profile pictures
2. `widgets` - For widget images

Then enable RLS policies (uncomment the storage policies in `schema.sql` and run them).

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser (use mobile viewport for best experience).

## Project Structure

```
wavelength/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login/signup pages
│   │   ├── (main)/           # Protected app pages
│   │   │   ├── page.tsx      # Home feed
│   │   │   ├── profile/      # User profile
│   │   │   ├── search/       # Search page
│   │   │   ├── prompts/      # Daily prompts
│   │   │   └── chat/         # Matches/chat
│   │   ├── api/              # API routes
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── ui/               # shadcn components
│   │   ├── widgets/          # Widget components
│   │   ├── feed/             # Feed components
│   │   ├── prompts/          # Prompt components
│   │   ├── search/           # Search components
│   │   ├── navigation/       # Bottom nav
│   │   └── notifications/    # Match notifications
│   ├── lib/
│   │   ├── supabase/         # Supabase clients
│   │   ├── actions/          # Server actions
│   │   ├── interests.ts      # Interest extraction
│   │   └── utils.ts          # Utilities
│   └── types/
│       └── database.ts       # TypeScript types
├── supabase/
│   ├── schema.sql            # Database schema
│   └── seed.sql              # Seed data
└── public/
```

## Demo Scenarios

1. **Scrollable widget profile**: Sign up and add text/image widgets
2. **Match notification**: Add widgets with interests that match other users
3. **Daily prompt**: Respond to today's prompt and see others' responses
4. **Search**: Search for "photography" to find related content
5. **Repost**: Tap reveal on a post and repost it to your profile

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

1. Push your code to GitHub
2. Import the repository on Vercel
3. Add your environment variables
4. Deploy!

## License

MIT
