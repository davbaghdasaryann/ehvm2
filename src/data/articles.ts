export type ContentBlock =
  | { type: "text"; value: string }
  | { type: "image"; src: string; caption?: string }
  | { type: "quote"; value: string; author: string };

export type Article = {
  slug: string;
  title: string;
  category: "Event" | "Story";
  thumbnail: string;
  thumbnailFit?: "contain";
  featured?: boolean;
  date?: string;
  readTime?: string;
  author?: { name: string; image: string };
  content?: ContentBlock[];
};

export const articles: Article[] = [
  {
    slug: "ehvm-europe-tour",
    title: "EHVM Europe Tour with 8 stops",
    category: "Event",
    thumbnail: "/images/eu-stars.png",
    thumbnailFit: "contain",
    featured: true,
    date: "Feb 10, 2026",
    readTime: "3 min",
  },
  {
    slug: "ehvm-dubai-meetup",
    title: "EHVM Dubai meetup",
    category: "Event",
    thumbnail: "/images/dubai.png",
    thumbnailFit: "contain",
    date: "Jan 28, 2026",
    readTime: "2 min",
  },
  {
    slug: "jane-doe-selling-notey",
    title: "How Jane Doe built and sold Notey for $2.4M",
    category: "Story",
    thumbnail: "/images/jane-doe.png",
    date: "Jan 15, 2026",
    readTime: "6 min",
    author: { name: "Evelin Herrera", image: "/images/evelin.png" },
    content: [
      { type: "text", value: "Jane Doe never planned to sell Notey. The note-taking app started as a weekend project in her Berlin apartment, a simple tool she built because nothing on the market worked the way she wanted it to." },
      { type: "text", value: "Within six months, Notey had 40,000 monthly active users. Within a year, it crossed $18,000 in MRR. The growth was entirely organic — fueled by word of mouth, a loyal Reddit community, and an App Store rating of 4.9." },
      { type: "image", src: "/images/app-screenshots.png", caption: "Notey's App Store screenshots at the time of acquisition" },
      { type: "text", value: "\"I was doing everything myself — development, support, marketing, content. At some point I realized I was running a company, not building a product anymore,\" Jane recalls. \"That's when I started thinking about what comes next.\"" },
      { type: "text", value: "Jane connected with EHVM through a referral from another founder in the Berlin startup scene. After an initial call, the team helped her understand what her app was actually worth and how to structure a deal that made sense." },
      { type: "quote", value: "I thought selling an app meant posting it on a marketplace and hoping for the best. EHVM showed me there's a proper way to do this — with the right buyers, the right terms, and the right support.", author: "Jane Doe" },
      { type: "text", value: "The due diligence process took three weeks. EHVM helped prepare a comprehensive data room covering product metrics, tech stack, advertising performance, and growth opportunities. Three qualified buyers submitted offers." },
      { type: "image", src: "/images/jane-doe.png", caption: "Jane Doe, founder of Notey" },
      { type: "text", value: "The final acquisition closed at $2.4M — roughly 11x trailing twelve months revenue. The buyer was a European app portfolio company looking to expand into productivity tools." },
      { type: "text", value: "\"The whole process took about 6 weeks from first call to money in my account. I thought it would take months. Now I'm working on my next thing, and I have the runway to do it right this time.\"" },
      { type: "text", value: "Jane's story is increasingly common in the app economy. Solo developers and small teams are building profitable, niche apps — and finding that there's a growing market of buyers eager to acquire them." },
    ],
  },
  {
    slug: "ray-liu-fitlog-acquisition",
    title: "From side project to $800k exit — Ray Liu on selling FitLog",
    category: "Story",
    thumbnail: "/images/rayul-_M6gy9oHgII-unsplash.jpg",
    date: "Feb 5, 2026",
    readTime: "5 min",
    author: { name: "Evelin Herrera", image: "/images/evelin.png" },
  },
  {
    slug: "ehvm-founders-workshop",
    title: "EHVM Founders Workshop — Build, Scale, Exit",
    category: "Event",
    thumbnail: "/images/woman.png",
    thumbnailFit: "contain",
    date: "Feb 20, 2026",
    readTime: "3 min",
  },
  {
    slug: "ehvm-weekly-digest",
    title: "EHVM Weekly Digest — App M&A News",
    category: "Event",
    thumbnail: "/images/paper.png",
    thumbnailFit: "contain",
    date: "Feb 18, 2026",
    readTime: "2 min",
  },
  {
    slug: "la-tech-week-recap",
    title: "LA Tech Week recap",
    category: "Event",
    thumbnail: "/images/la-tech-week.png",
    thumbnailFit: "contain",
    date: "Dec 8, 2025",
    readTime: "4 min",
  },
  {
    slug: "max-man-selling-one",
    title: "EHVM acquires One — a $130k MRR meditation app",
    category: "Story",
    thumbnail: "/images/max-man.png",
    date: "Nov 20, 2025",
    readTime: "5 min",
    author: { name: "Evelin Herrera", image: "/images/evelin.png" },
    content: [
      { type: "text", value: "One started as a side project by Max Man, a Copenhagen-based developer who wanted a meditation app that didn't feel like a Silicon Valley product. No gamification, no streaks, no push notifications begging you to come back. Just guided sessions and silence." },
      { type: "text", value: "The minimalist approach resonated. One grew to 130,000 in monthly recurring revenue with a small but dedicated user base of 85,000 subscribers across iOS and Android." },
      { type: "image", src: "/images/app-screenshots.png", caption: "One's meditation interface — clean, minimal, intentional" },
      { type: "text", value: "Max had been approached by buyers before, but the offers never felt right. \"They wanted to bolt on ads, add a social feed, turn it into something it wasn't,\" he explains. \"I needed to find a buyer who understood what made the app special.\"" },
      { type: "text", value: "EHVM brokered the deal between Max and a health-tech holding company that operates a portfolio of wellness apps across Europe. The buyer's thesis: keep the product exactly as it is, invest in localization, and expand to new markets." },
      { type: "quote", value: "What made EHVM different is they didn't just find any buyer — they found the right buyer. Someone who saw the same value in the product that I did.", author: "Max Man" },
      { type: "text", value: "The acquisition process followed EHVM's standard framework: initial valuation, mutual NDA, data room preparation, buyer matching, due diligence, and escrow-based asset transfer." },
      { type: "image", src: "/images/max-man.png", caption: "Max Man, founder of One" },
      { type: "text", value: "Key metrics that drove the valuation included a 4.8 App Store rating, 70% annual subscriber retention, and strong organic growth through App Store Optimization — One ranked for over 3,000 keywords in the health and fitness category." },
      { type: "text", value: "The deal closed at an undisclosed amount, though sources familiar with the transaction place it in the mid-seven figures. Max has since joined EHVM as an advisor, helping other founders navigate the process he went through." },
      { type: "text", value: "\"Building One taught me how to make something people love. Selling it taught me that there's an art to letting go at the right time. Not every founder needs to hold on forever — sometimes the best thing for your users is finding someone who can take it further.\"" },
    ],
  },
];
