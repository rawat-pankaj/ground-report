# PeopleLens

A hand-curated portal of independent Indian YouTube journalism, live at
[www.peoplelens.in](https://www.peoplelens.in). A person (the curator) browses a
channel's uploads and picks individual videos to publish; nothing appears on the
public site unless a human chose it. Readers can suggest channels and videos, and
suggestions wait in a queue until the curator reviews them.

(The project used to be called "Ground Report", which is why the repository and the
database still carry that name.)

## What's in here

- **Public site**
  - **Home** (`/`): a featured story and a grid of 48 stories at a time with "Load
    more", category chips, and a search box in the header (a search icon on phones).
  - **Story cards** show a category label, a Hindi or English tag, the channel and
    the date. Stories open on PeopleLens, not on YouTube.
  - **Video pages** (`/video/<id>`): the embedded player, the curator's note
    ("Why this matters"), place, categories, related stories, and a link out to YouTube.
  - **Search** (`/search`), **Suggest a video** (`/suggest`), **About** (`/about`),
    a footer, a sitemap and robots file.
- **Admin** (`/admin`, behind a password; see "Day-to-day use")
- **Database**: seven tables in Postgres, defined in `prisma/schema.prisma`:
  channels, videos, categories (and the link between videos and categories),
  nominations (reader suggestions), and two small tables that rate-limit the
  suggestion form and admin login.

**Stack:** Next.js 16 (App Router), React 18, Tailwind 3, Prisma 5, Postgres on
Supabase, hosted on Vercel. Use Node 22 or newer.

## 1. Get a YouTube API key (free)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project
2. Enable the **YouTube Data API v3** (APIs & Services → Library → search for it → Enable)
3. Create a key: APIs & Services → Credentials → Create Credentials → API key
4. Copy the key. You'll paste it into `YOUTUBE_API_KEY` below.

This gives you 10,000 free quota units a day (see "Notes on the YouTube API quota").

## 2. Get a free database (Supabase)

1. Go to [supabase.com](https://supabase.com) → New project (the free tier is enough)
2. Click **Connect** (or Project settings → Database → Connection string) and copy two strings:
   - the pooled connection (port 6543, with `?pgbouncer=true` on the end) is your
     `POSTGRES_PRISMA_URL`. It's what the running site uses.
   - the direct connection (port 5432) is your `POSTGRES_URL_NON_POOLING`. Prisma
     uses it to create tables.
3. Copy them from Supabase, not from Vercel: Vercel hides stored values after you save them.
4. Create the tables in the new, empty database:

   ```bash
   npx prisma db push
   ```

   If you would rather paste SQL into Supabase's SQL editor, this prints it:

   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
   ```

5. In Supabase, turn on **Row Level Security** for all seven tables. The site
   connects with the database owner's login, which is not affected, but RLS keeps
   Supabase's public API from reading them.

There is no `prisma/migrations` folder. To change the tables on a live database,
write the SQL (for example `ALTER TABLE ... ADD COLUMN`), run it in Supabase's SQL
editor, and only then deploy the code that uses it. Otherwise every query fails.

## 3. Configure environment variables

Copy `.env.example` to `.env` and fill in the four values (never commit `.env`):

```
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."
YOUTUBE_API_KEY="..."
ADMIN_PASSWORD="choose-a-strong-password"
```

## 4. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` for the public site and `http://localhost:3000/admin`
to log in with your `ADMIN_PASSWORD`. A login lasts 30 days, is tied to the address
you signed in at, and ends everywhere if you change the password.

**Careful:** the local site uses whatever database `.env` points at. If that is the
live database, anything you change in Admin changes the live site. Use a separate
Supabase project for experiments.

There are no automated tests. `npm run build` (which runs `prisma generate` first)
is the check before pushing.

## 5. Deploy (Vercel)

1. Push this folder to a GitHub repository
2. In [vercel.com](https://vercel.com) → New Project → import that repository
3. In **Settings → Environment Variables**, add the same four variables
4. Deploy. After that, every push to `main` redeploys automatically.

`vercel.json` pins the server functions to Mumbai (`bom1`), next to the database.
If your database is in another region, change that to the nearest Vercel region.

After a push, wait for the deploy to show Ready, then check the live site and the
thing you changed. If a deploy goes wrong, use Vercel's rollback.

## Day-to-day use

The Admin menu has seven pages:

- **Published Videos**: every curated video. Set the language, region, "Why this
  matters" note, place and categories, hide or publish a video, delete it, or
  **Set as featured**. Only one video is featured at a time; if none is, you'll see
  a note here and the home page has no featured story.
- **Suggested Videos**: reader suggestions. "Review & pick videos" opens the picker,
  pre-filled with that channel.
- **Add channel**: paste a channel link or `@handle`, tick the videos you want, publish.
- **Add video**: add a single video by its link.
- **Categories**: create, rename and delete categories.
- **Stats** and **Link check**: counts, and a check for videos that have been
  deleted or made private on YouTube.

## Notes on the YouTube API quota

- Pasting a channel link or `@handle` costs about 1 unit
- Browsing a channel's uploads costs about 1 unit per page of 25 videos
- Typing free text instead of a link falls back to a real search, which costs 100
  units. Pasting the actual link is much cheaper and more reliable.
- The link check costs about 1 unit per 50 videos
- With the default 10,000 units a day you can browse dozens of channels without
  getting near the limit

## How it works, in short

- Public data is cached and refreshed by Admin changes (cache tag `"videos"`), not by a timer.
- Admin pages and `/api/admin/*` are protected by a signed, expiring cookie.
- Fonts are served from `public/fonts`, and only the featured image goes through
  Next.js image optimization.

The details, and the rules to follow when changing things, are in `CLAUDE.md`.

## Other files

- `CLAUDE.md`: working notes and architecture rules (also read by Claude Code at the start of each session)
- `ISSUES.md`: the running tracker: what shipped and when, known issues, and ideas
  parked for later
- `.env.example`: the names of the environment variables
- `vercel.json`: the Vercel region

## What could come next

See `ISSUES.md`. Ideas that are written up there include channel and category pages,
an RSS feed, sorting and filtering in Admin, email alerts for new suggestions, and
a Hindi version of the site's text.
