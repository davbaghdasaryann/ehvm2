# Notion CMS Setup Guide

This guide explains how to connect the EHVM website to Notion so apps, articles, and all their details can be managed from Notion databases.

---

## Overview

The website is pre-wired for Notion CMS:

- **`src/lib/data.ts`** — Data access layer with async functions. Currently returns static data. Replace each function body with Notion API calls.
- **`next.config.ts`** — Already configured with `remotePatterns` for Notion-hosted images.
- **`.env.example`** — Template for required environment variables.
- **ISR (60s revalidate)** — All data pages auto-refresh every 60 seconds, so Notion edits appear on the live site within a minute.

---

## Step 1: Create a Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"New integration"**
3. Name it (e.g. "EHVM Website")
4. Select your workspace
5. Copy the **Internal Integration Secret** → this is your `NOTION_API_KEY`

---

## Step 2: Create the Databases

You need **2 main databases** (and optionally 2 related databases for nested data).

### Database 1: Apps

This powers `/apps` and `/apps/[slug]`. See the **Coachify** listing for an example of a fully populated app with all sections filled in.

| Property Name | Type | Description | Example (Coachify) |
|---|---|---|---|
| **Name** | Title | App display name | `Coachify` |
| **Slug** | Rich text | URL slug (unique) | `coachify` |
| **Subtitle** | Rich text | Short tagline | `ai Workouts` |
| **Icon** | Files & media | App icon image (square) | Upload PNG |
| **MRR** | Rich text | MRR display value | `70k` |
| **Platform** | Select | `iOS` / `Android` / `Web` | `iOS` |
| **PlatformEmoji** | Rich text | Emoji for platform | `📱` |
| **Rating** | Number | App store rating (1–5) | `4.7` |
| **Followers** | Rich text | Follower/download label (optional) | `110k Followers` |
| **Category** | Select | App Store category with emoji | `💪 Health & Fitness` |
| **About** | Rich text | Full description paragraph | `Top-rated gym workout…` |
| **HighlightsMRR** | Rich text | Formatted MRR for highlights section | `70,000$` |
| **HighlightsRating** | Rich text | Rating value for highlights | `4.7` |
| **HighlightsRatingLabel** | Rich text | Label under rating | `iOS Rating` |
| **HighlightsFollowers** | Rich text | Follower count for highlights | `110,00` |
| **HighlightsFollowersLabel** | Rich text | Label under followers | `Combined Followers` |
| **Screenshots** | Files & media | App screenshots composite image | Upload PNG |
| **AppStoreLink** | URL | App Store link (optional) | `https://apps.apple.com/…` |
| **PlayStoreLink** | URL | Play Store link (optional) | `https://play.google.com/…` |
| **Opportunities** | Rich text | Growth opportunities, one per line | `💳 A/B test paywalls…` (newline-separated) |
| **DeveloperCountry** | Rich text | Country name | `Denmark` |
| **DeveloperFlag** | Rich text | Flag emoji | `🇩🇰` |
| **ContactName** | Rich text | POC name | `Evelin Herrera` |
| **ContactImage** | Files & media | POC headshot | Upload PNG |
| **ContactEmail** | Rich text | POC email | `hi@evelinherrera.com` |
| **ContactPhone** | Rich text | POC phone | `+1 415 798 1766` |

**Category select options** (create these in the select property):

*App categories:*
- `📸 Photo & Video`
- `🎨 Graphics & Design`
- `📺 Entertainment`
- `🔧 Utilities`
- `💪 Health & Fitness`
- `💬 Social Networking`
- `⚡ Productivity`
- `🌤️ Weather`
- `🍽️ Food & Drink`
- `📖 Reference`

*Game categories:*
- `🧩 Puzzle`
- `🏗️ Simulation`
- `🏎️ Racing`
- `⚽ Sports`
- `🐉 RPG`
- `😂 Meme`

#### User Acquisition Channels (Related Database — Optional)

For paid and organic channels on the app detail page. Create a separate **Channels** database:

| Property Name | Type | Description | Example |
|---|---|---|---|
| **Name** | Title | Channel name | `Instagram` |
| **Subtitle** | Rich text | Channel type | `Organic` |
| **Icon** | Files & media | Channel logo/icon | Upload SVG/PNG |
| **Metric** | Rich text | Key metric display | `99.7k Followers` |
| **MetricStyle** | Select | `dark` or `light` | `light` |
| **ChannelType** | Select | `Paid` or `Organic` | `Organic` |
| **App** | Relation | → Apps database | Link to Coachify |

Then in the Apps database, add:
- **PaidChannels** (Relation → Channels, filtered to `Paid`)
- **OrganicChannels** (Relation → Channels, filtered to `Organic`)

**Alternative (simpler):** Skip the related database and use a single **rich text** property with JSON for each:
```
PaidChannelsJSON: [{"name":"Meta Ads","subtitle":"Payed","icon":"/images/meta-ads.svg","metric":"Metrics (NDA)","metricStyle":"dark"}]
OrganicChannelsJSON: [{"name":"Instagram","subtitle":"Organic","icon":"/images/instagram.svg","metric":"99.7k Followers"}]
```

#### FAQs (Related Database — Optional)

For the FAQ accordion on app detail pages. Create a separate **FAQs** database:

| Property Name | Type | Description | Example |
|---|---|---|---|
| **Question** | Title | FAQ question | `Am I buying an app or a company?` |
| **Answer** | Rich text | FAQ answer | `You are buying the App asset.` |
| **App** | Relation | → Apps database | Link to Coachify |
| **Order** | Number | Display order | `1` |

Then in the Apps database, add:
- **FAQs** (Relation → FAQs database)

**Alternative (simpler):** Use a single **rich text** property with JSON:
```
FAQsJSON: [{"question":"Am I buying an app or a company?","answer":"You are buying the App asset."}]
```

---

### Database 2: Articles

This powers `/news/all` and `/news/[slug]`.

| Property Name | Type | Description | Example |
|---|---|---|---|
| **Title** | Title | Article headline | `How Jane Doe built and sold Notey for $2.4M` |
| **Slug** | Rich text | URL slug (unique) | `jane-doe-selling-notey` |
| **Category** | Select | `Event` / `Story` / `Interview` | `Story` |
| **Thumbnail** | Files & media | Card image | Upload PNG |
| **Featured** | Checkbox | Show as featured card on /news/all | ✅ |
| **Date** | Rich text | Display date string | `Jan 15, 2026` |
| **ReadTime** | Rich text | Read time label | `6 min` |
| **AuthorName** | Rich text | Author name (optional) | `Evelin Herrera` |
| **AuthorImage** | Files & media | Author avatar (optional) | Upload PNG |

#### Article Content (Page Body)

Article content uses **Notion page blocks** (the body of the Notion page itself). The website supports 3 block types:

| Notion Block | Maps To | Notes |
|---|---|---|
| **Paragraph** | `{ type: "text", value: "…" }` | Regular body text |
| **Image** | `{ type: "image", src: "…", caption: "…" }` | Inline images with optional caption |
| **Quote** | `{ type: "quote", value: "…", author: "…" }` | Blockquotes. Put author name after `—` in the quote text |

To fetch article content, use `notion.blocks.children.list({ block_id: pageId })` and map each block to the `ContentBlock` type.

---

## Step 3: Share Databases with Integration

For each database:
1. Open the database in Notion
2. Click **"…"** → **"Connections"** → **"Connect to"**
3. Select your integration (e.g. "EHVM Website")

---

## Step 4: Get Database IDs

Each database URL looks like:
```
https://www.notion.so/<workspace>/<DATABASE_ID>?v=<view_id>
```

Copy the 32-character `DATABASE_ID` for each database.

---

## Step 5: Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
NOTION_API_KEY=secret_your_key_here
NOTION_APPS_DB_ID=your_apps_database_id
NOTION_ARTICLES_DB_ID=your_articles_database_id
```

---

## Step 6: Install the Notion SDK

```bash
npm install @notionhq/client
```

---

## Step 7: Update src/lib/data.ts

Replace the static data returns with Notion API calls. The file contains commented-out Notion code showing exactly how to implement each function:

1. `getApps()` → Query the Apps database
2. `getAppBySlug(slug)` → Query Apps database with slug filter
3. `getAppCategories()` → Pull category select options
4. `getArticles()` → Query the Articles database, sorted by date
5. `getArticleBySlug(slug)` → Query Articles database with slug filter + fetch page blocks for content

Each function has TODO comments with the exact Notion API code to uncomment and adapt.

---

## How Each App Detail Section Maps to Notion

Reference: the **Coachify** app detail page shows all possible sections.

| Section on Page | Notion Properties |
|---|---|
| **Header** (icon, name, subtitle, pills) | Icon, Name, Subtitle, MRR, Rating, Followers |
| **About** | About |
| **Store Links** | AppStoreLink, PlayStoreLink |
| **Highlights** (3-column MRR/Rating/Followers) | HighlightsMRR, HighlightsRating, HighlightsRatingLabel, HighlightsFollowers, HighlightsFollowersLabel |
| **Screenshots** | Screenshots |
| **User Acquisition — Paid** | PaidChannels relation (or PaidChannelsJSON) |
| **User Acquisition — Organic** | OrganicChannels relation (or OrganicChannelsJSON) |
| **Opportunities** | Opportunities (newline-separated list) |
| **Developer's Country** | DeveloperCountry, DeveloperFlag |
| **FAQs** | FAQs relation (or FAQsJSON) |
| **Contact / Interested?** | ContactName, ContactImage, ContactEmail, ContactPhone |

**All sections are conditionally rendered** — if a property is empty in Notion, that section simply won't appear on the page. So apps can have as much or as little detail as needed.

---

## Image Handling

- `next.config.ts` already allows Notion S3 URLs (`prod-files-secure.s3.us-west-2.amazonaws.com`)
- Notion file URLs expire after 1 hour. For production, consider:
  - Downloading and caching images locally
  - Using a CDN proxy like Cloudinary or imgix
  - Re-uploading to your own S3 bucket during build

---

## ISR (Incremental Static Regeneration)

All data pages have `revalidate = 60` — the site re-fetches data from Notion every 60 seconds. Adjust this value per page if needed:

| Page | Current Revalidation |
|---|---|
| `/apps` | 60s |
| `/apps/[slug]` | 60s |
| `/news/all` | 60s |
| `/news/[slug]` | 60s |

For instant updates, you can set up a [Notion webhook](https://developers.notion.com/) + Next.js [on-demand revalidation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration#on-demand-revalidation-with-revalidatetag).

---

## Quick Start Checklist

- [ ] Create Notion integration and get API key
- [ ] Create **Apps** database with all properties listed above
- [ ] Create **Articles** database with all properties listed above
- [ ] (Optional) Create **Channels** and **FAQs** related databases
- [ ] Share all databases with the integration
- [ ] Copy database IDs
- [ ] Create `.env.local` from `.env.example`
- [ ] Run `npm install @notionhq/client`
- [ ] Update `src/lib/data.ts` — uncomment Notion code, remove static imports
- [ ] Test with `npm run dev`
- [ ] Add a few apps/articles in Notion and verify they appear on the site
