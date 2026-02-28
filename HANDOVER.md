# EHVM Apps Capital — Project Handover Note

## What is this?
A Next.js marketplace website for **EHVM Apps Capital** — a platform connecting mobile app sellers and buyers. Built with **Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript**.

Dev server: `npm run dev` → `localhost:3000`

---

## Design Language
- **Palette**: Minimalist grayscale — background `#d2d2d2`, cards `#c9c9c9`, accents black/white. **Dark mode** flips to `#1a1a1a` background, `#262626` cards, white accents.
- **Typography**: System sans-serif (Helvetica Neue) for UI, **Source Serif 4** (`--font-serif`) for editorial/headlines
- **Shapes**: Large rounded corners everywhere (cards 33px, icons 21px, pills 100px)
- **Shadows**: Subtle 3-layer diffused shadow defined as `--shadow-icon` in globals.css, used via `shadow-icon` Tailwind class
- **Animations**: SVG logo stroke-draw, floating icon pop-in, drift/parallax on mouse move, slide-up entrance on scrollable pages
- **Theme tokens**: All design values defined in `globals.css` `@theme inline` block. Dark overrides in `html.dark {}`. Use Tailwind classes (`bg-card`, `bg-tag`, `rounded-card`, `rounded-icon`, `rounded-pill`, `text-primary-text`, `text-muted`, `text-body`, `text-caption`, `text-faint`, `border-divider`) — never hardcode hex values or use Tailwind built-in colors like `bg-black`/`text-black`.
- **Dark mode**: Toggle via `html.dark` class. Managed by `ThemeProvider` context + inline FOUC-prevention script. Toggle button in NavPills (all pages) + floating icon on home page. Persisted in `localStorage("ehvm-theme")`, falls back to `prefers-color-scheme`.

---

## Routes & Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Home — floating app icons with parallax, EHVM logo animation, "See more Apps" CTA |
| `/apps` | `src/app/apps/page.tsx` | App gallery — 41 apps, horizontally scrollable category filters with emojis (App Store categories) |
| `/apps/[slug]` | `src/app/apps/[slug]/page.tsx` | App detail — metrics, about, screenshots, user acquisition, FAQs (accordion), contact + calendar booking |
| `/news` | `src/app/news/page.tsx` | News hub — floating article thumbnails, "See more News" CTA |
| `/news/all` | `src/app/news/all/page.tsx` | All news — featured card + filterable list (Stories/Events) |
| `/news/[slug]` | `src/app/news/[slug]/page.tsx` | Article detail — content blocks (text/image/quote) |
| `/contact` | `src/app/contact/page.tsx` | Contact — floating team photos (Evelin→/story, Sam→#contact), Buy/Sell CTAs, "Our Story" link |
| `/story` | `src/app/story/page.tsx` | Our Story — article-style page about founder Evelin, inline YouTube + tweet embeds, social links |

---

## Components

| Component | File | Notes |
|-----------|------|-------|
| **NavPills** | `src/components/NavPills.tsx` | Top nav with 3 pills (Home/News/Contact) + dark mode toggle button. `pt-[38px]`. Home active for `/` and `/apps/*`. Contact active for `/contact` and `/story`. |
| **FloatingIcons** | `src/components/FloatingIcons.tsx` | Client component. Scatters items avoiding center safe-zone. Drift animation + mouse parallax. Used on home, news, contact. |
| **EhvmLogo** | `src/components/EhvmLogo.tsx` | SVG with animated stroke-dashoffset writing effect |
| **AppCard** | `src/components/AppCard.tsx` | Card with icon, name, subtitle, MRR/platform/rating pills |
| **FilterTabs** | `src/components/FilterTabs.tsx` | Horizontally scrollable pill buttons. `px-[10px]` internal padding. `center` prop for centered layout. |
| **FaqAccordion** | `src/components/FaqAccordion.tsx` | Expandable Q&A with animated max-height |
| **CalendarWidget** | `src/components/CalendarWidget.tsx` | Interactive date/time picker for booking calls |
| **ThemeProvider** | `src/components/ThemeProvider.tsx` | Dark mode context. Reads `localStorage("ehvm-theme")`, toggles `dark` class on `<html>`. Exposes `{ theme, toggleTheme }`. |
| **DarkModeToggle** | `src/components/DarkModeToggle.tsx` | Floating icon button (moon/sun) for toggling dark mode. Used on home page as 7th floating item. |

---

## Data Architecture

**All pages fetch data through `src/lib/data.ts`** — never directly from `src/data/*`. This makes swapping the data source (e.g. to Notion) a single-file change.

| File | Purpose |
|------|---------|
| `src/lib/data.ts` | **Data access layer** — async functions (`getApps()`, `getAppBySlug()`, `getArticles()`, etc.). Currently wraps static data. Replace with Notion API calls. |
| `src/data/apps.ts` | Static app data — `App` type + 41 apps across 9 categories. Each app is defined inline with shared defaults (`defaultContact`, `defaultScreenshots`, `defaultFaqs`). |
| `src/data/articles.ts` | Static article data — `Article` type with `ContentBlock[]` (text/image/quote). 8 articles. |
| `.env.example` | Template for Notion API keys and database IDs. |

**ISR**: All data pages have `revalidate = 60` — content refreshes every 60 seconds.

**Client/Server split**: Pages with interactive filtering (apps gallery, news list) are split into a server page (fetches data) + client component (handles UI state). See `AppsGallery.tsx` and `NewsListView.tsx`.

### Image Organization
- `/public/images/` — Article thumbnails, team photos, screenshots
- `/public/images/App Icons/` — App icons (41 files, `.avif` and `.webp`, hyphenated names)
- `/public/images/Icons/` — UA channel icons (app-store.svg, google-play.svg, instagram.svg, meta-ads.svg, tiktok.svg)

### Notion CMS Integration

The project is pre-wired for Notion. See **`NOTION_SETUP.md`** for the complete guide including:
- Notion database schemas for Apps and Articles
- Property-by-property mapping to the UI
- How every section of the app detail page (highlights, user acquisition, opportunities, FAQs, etc.) maps to Notion properties
- Step-by-step connection instructions

---

## Layout Architecture

**Root layout** (`src/app/layout.tsx`):
```
<html suppressHydrationWarning>
  <head><script>/* FOUC prevention — sets dark class before first paint */</script></head>
  <body>
    <ThemeProvider>
      <div class="min-h-[100dvh] flex flex-col items-center">
        <NavPills />       ← pt-[38px] pb-[18px] + dark mode toggle
        {children}
      </div>
    </ThemeProvider>
  </body>
</html>
```

**Landing pages** (home/news/contact) use:
```
<main class="... h-[calc(100dvh-97px)] overflow-hidden">
  <FloatingIcons />           ← absolute inset-0
  <div class="flex-1" />      ← top spacer
  <div>logo + text</div>      ← centered content
  <div class="flex-1 ... pb-[42px]">  ← bottom spacer + CTA button
</main>
```

**Scrollable pages** (apps, news/all, story, app detail, article detail) just render content normally inside `<main>`.

---

## Known Issues & Decisions

1. **Shadow clipping on mobile Safari** — The Safari bottom toolbar pushes viewport up, revealing overflow-hidden clip edges. Mitigated by reducing shadow size. `overflow-hidden` is still on landing page mains (needed to contain floating icons). Might still show a faint clip line during aggressive overscroll rubber-banding.

2. **`100dvh` vs `100vh`** — Uses `100dvh` (dynamic viewport height) for landing page heights and wrapper min-height. This adjusts when the Safari address bar collapses/expands.

3. **Placeholder content** — YouTube embeds on `/story` use placeholder video IDs. Tweet embeds use fake URLs that won't render. Social links point to bare domain roots. Contact page has placeholder copy and `#` links. All need real URLs/content.

4. **Test App** — "Test App: All Content" (`test-app-all-content`) exists at the top of the apps list as a reference showing every field populated. Remove before production.

5. **Unsplash image** — `public/images/rayul-_M6gy9oHgII-unsplash.jpg` is from Unsplash. Under their license, attribution is not legally required but is appreciated. If used publicly, consider adding a credit.

---

## Licensing

| Dependency | License | Notes |
|------------|---------|-------|
| Next.js, React, React DOM | MIT | Standard web framework |
| Tailwind CSS, @tailwindcss/postcss | MIT | Styling |
| TypeScript, ESLint | MIT / Apache-2.0 | Dev tools |
| Source Serif 4 (font) | SIL Open Font License | Google Font, free for commercial use |
| Helvetica Neue (font) | System font | Ships with macOS/iOS, no license needed |

All npm dependencies are MIT or Apache-2.0 licensed. No proprietary or restrictively licensed packages.

---

## Project Transfer

### Option A: Vercel Project Transfer (Recommended)

Vercel lets you transfer a project directly to another Vercel account. This preserves the deployment history, environment variables, and domain configuration.

1. **Recipient creates a Vercel account** at [vercel.com](https://vercel.com) (free tier works)
2. **Current owner** goes to Vercel Dashboard → Project → Settings → General → **Transfer Project**
3. Enter the recipient's Vercel username or email
4. Recipient accepts the transfer from their Vercel dashboard
5. Recipient connects their own GitHub/GitLab repo (or you transfer the Git repo too)
6. Recipient sets environment variables (see `.env.example`) if using Notion CMS
7. Custom domain: Recipient adds their domain under Project → Settings → Domains

### Option B: ZIP Package + Fresh Deploy

If the client prefers a clean start:

1. **Create the ZIP**:
   ```bash
   cd <project-folder>
   # Clean build artifacts
   rm -rf .next node_modules
   # Create archive (exclude git history and IDE files)
   zip -r ../EHVM-Website.zip . -x ".git/*" ".next/*" "node_modules/*" ".claude/*" ".vercel/*" ".DS_Store"
   ```

2. **Client setup**:
   ```bash
   unzip EHVM-Website.zip -d ehvm-website
   cd ehvm-website
   npm install
   npm run dev        # local dev at localhost:3000
   npm run build      # production build (verify no errors)
   ```

3. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   # Deploy (follow prompts)
   vercel
   # Set environment variables for Notion (if applicable)
   vercel env add NOTION_API_KEY
   vercel env add NOTION_APPS_DB_ID
   vercel env add NOTION_ARTICLES_DB_ID
   # Deploy to production
   vercel --prod
   ```

   Or push to GitHub and import via [vercel.com/new](https://vercel.com/new).

### Post-Transfer Checklist

- [ ] `npm run build` completes without errors
- [ ] All pages render correctly on `localhost:3000`
- [ ] Dark mode toggle works
- [ ] Floating icons animate properly
- [ ] Replace placeholder content on `/story` (YouTube, tweets, social links)
- [ ] Remove test app (`test-app-all-content`) from `src/data/apps.ts`
- [ ] Set up Notion CMS if desired (see `NOTION_SETUP.md`)
- [ ] Configure custom domain on Vercel
- [ ] Verify favicon appears (EHVM icon)

---

## Design Tokens (globals.css `@theme`)

```css
/* Token                    Light                           Dark (html.dark)           Tailwind class */
--color-background:         #d2d2d2                         #1a1a1a                    bg-background
--color-foreground:         #000000                         #e8e8e8                    text-foreground
--color-card:               #c9c9c9                         #262626                    bg-card
--color-tag:                #d2d2d2                         #2f2f2f                    bg-tag
--color-primary:            #000000                         #ffffff                    bg-primary
--color-primary-text:       #d2d2d2                         #1a1a1a                    text-primary-text
--color-glass:              rgba(180,180,180,0.65)          rgba(50,50,50,0.65)        bg-glass
--color-body:               rgba(0,0,0,0.8)                rgba(255,255,255,0.8)      text-body
--color-muted:              rgba(0,0,0,0.5)                rgba(255,255,255,0.5)      text-muted
--color-caption:            rgba(0,0,0,0.45)               rgba(255,255,255,0.45)     text-caption
--color-faint:              rgba(0,0,0,0.25)               rgba(255,255,255,0.25)     text-faint
--color-divider:            rgba(0,0,0,0.1)                rgba(255,255,255,0.1)      border-divider

/* Radii (same in both modes) */
--radius-card: 33px        /* rounded-card */
--radius-icon: 21px        /* rounded-icon */
--radius-pill: 100px       /* rounded-pill */

/* Shadow (deeper in dark mode) */
--shadow-icon: ...         /* shadow-icon */
```

---

## File Tree (key files only)

```
├── .env.example              ← Notion env vars template
├── next.config.ts            ← Notion image remote patterns
├── HANDOVER.md               ← this file
├── NOTION_SETUP.md           ← full Notion CMS setup guide
└── src/
    ├── app/
    │   ├── layout.tsx          ← root layout, loads Source Serif 4 font
    │   ├── globals.css         ← design tokens, animations, scrollbar hiding
    │   ├── page.tsx            ← home
    │   ├── apps/
    │   │   ├── page.tsx        ← server page (fetches data, renders AppsGallery)
    │   │   ├── AppsGallery.tsx ← client component (filtering UI)
    │   │   └── [slug]/page.tsx ← app detail (server, ISR)
    │   ├── news/
    │   │   ├── page.tsx        ← news hub
    │   │   ├── all/
    │   │   │   ├── page.tsx      ← server page (fetches data, renders NewsListView)
    │   │   │   └── NewsListView.tsx ← client component (filtering UI)
    │   │   └── [slug]/page.tsx ← article detail (server, ISR)
    │   ├── contact/page.tsx    ← contact
    │   └── story/page.tsx      ← our story (client component)
    ├── components/
    │   ├── NavPills.tsx
    │   ├── FloatingIcons.tsx
    │   ├── EhvmLogo.tsx
    │   ├── AppCard.tsx
    │   ├── FilterTabs.tsx
    │   ├── FaqAccordion.tsx
    │   ├── CalendarWidget.tsx
    │   ├── ThemeProvider.tsx       ← dark mode context + localStorage persistence
    │   └── DarkModeToggle.tsx      ← moon/sun floating icon toggle
    ├── lib/
    │   └── data.ts             ← data access layer (swap static → Notion here)
    └── data/
        ├── apps.ts             ← static app data (41 apps, 9 categories)
        └── articles.ts         ← static article data (8 articles, 2 categories)
```
