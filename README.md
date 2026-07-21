# Ground report

A hand-curated feed of independent YouTube journalism. You (or a small team)
browse a channel's uploads and pick individual videos to publish — nothing
appears on the public feed unless a human chose it. Anyone can suggest a
channel through a nomination form; nominations sit in a queue until you
review them.

## What's in here

- **Public site** — a filterable feed (`/`) and a "suggest a journalist" form (`/suggest`)
- **Admin section** (`/admin`, password protected) — a dashboard of curated
  videos, a tool to search a channel and hand-pick its videos, and a
  nominations queue
- **Database** — three tables: channels, videos, nominations (Postgres via Prisma)

## 1. Get a YouTube API key (free)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project
2. Enable the **YouTube Data API v3** (APIs & Services → Library → search for it → Enable)
3. Create a key: APIs & Services → Credentials → Create Credentials → API key
4. Copy the key — you'll paste it into `YOUTUBE_API_KEY` below

This gives you 10,000 free quota units/day. Looking up a channel and browsing
its uploads costs about 1 unit per page, so this comfortably supports normal
day-to-day curation.

## 2. Get a free database (Supabase)

1. Go to [supabase.com](https://supabase.com) → New project (free tier is enough)
2. Once created, go to **Project settings → Database → Connection string**
   and copy the URI (choose "Connection pooling" if offered, port 6543,
   and add `?pgbouncer=true` to the end)
3. That's your `DATABASE_URL`

## 3. Configure environment variables

Copy `.env.example` to `.env` and fill in the three values:

```
DATABASE_URL="postgresql://..."
YOUTUBE_API_KEY="..."
ADMIN_PASSWORD="choose-a-strong-password"
```

## 4. Run it locally (optional, to try before deploying)

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Visit `http://localhost:3000` for the public feed and
`http://localhost:3000/admin` to log in with your `ADMIN_PASSWORD`.

## 5. Deploy (Vercel)

1. Push this folder to a new GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → import that repo
3. In the project's **Settings → Environment Variables**, add the same three
   variables from your `.env` file
4. Deploy

The very first deploy needs the database tables created once:

```bash
# from your own machine, with .env pointing at the same DATABASE_URL
npx prisma migrate deploy
```

After that, every push to your repo redeploys automatically.

## Day-to-day use

- **Add a channel**: Admin → Add channel → paste a channel URL (or `@handle`)
  → tick the videos you want → Publish
- **Review a suggestion**: Admin → Nominations → "Review & pick videos" drops
  you into the same picker, pre-filled with that channel
- **Edit tags or unpublish**: Admin → Videos, edit the language/region/beat
  fields inline or hit Hide/Remove

## Notes on the YouTube API quota

- Looking up a channel by pasting its URL/handle costs ~1 unit
- Browsing a channel's uploads costs ~1 unit per page of 25 videos
- Typing free text instead of a link falls back to a real search, which
  costs 100 units — pasting the actual channel link is much cheaper and
  more reliable, so encourage nominators to include one
- With the default 10,000 units/day, you can comfortably browse dozens of
  channels a day without any risk of hitting the ceiling

## Extending later

- Swap the shared-password admin login for real per-editor accounts (e.g.
  NextAuth) once more than one or two people curate
- Add a cron job that re-checks already-added channels for new uploads,
  surfacing them in the admin dashboard as suggestions rather than
  auto-publishing them
- Add an embedded player instead of linking out to YouTube, if you want
  people to stay on-site
