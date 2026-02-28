"use client";

import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";

export default function StyleGuide() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="w-full max-w-[600px] px-[24px] pb-[80px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-[40px]">
        <div>
          <h1 className="text-[28px] text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
            Style Guide
          </h1>
          <p className="text-[13px] text-caption mt-[2px]">EHVM Apps Capital</p>
        </div>
        <button
          onClick={toggleTheme}
          className="bg-primary text-primary-text px-[15px] py-[10px] rounded-pill text-[14px] cursor-pointer border-0"
        >
          {theme === "light" ? "Switch to Dark" : "Switch to Light"}
        </button>
      </div>

      {/* ─── Color Palette ─── */}
      <Section title="Color Palette">
        <p className="text-[13px] text-body mb-[16px]">
          Every color adapts between light and dark mode. Toggle the button above to preview.
        </p>
        <div className="grid grid-cols-4 gap-[8px]">
          {[
            { label: "Background", color: "bg-background" },
            { label: "Card", color: "bg-card" },
            { label: "Tag", color: "bg-tag" },
            { label: "Thumbnail", color: "bg-thumbnail" },
            { label: "Primary", color: "bg-primary" },
            { label: "Glass", color: "bg-glass" },
            { label: "Divider", color: "bg-divider" },
            { label: "Faint", color: "bg-faint" },
          ].map((c) => (
            <div key={c.label} className="flex flex-col items-center gap-[6px]">
              <div className={`w-full aspect-square rounded-icon border border-divider ${c.color}`} />
              <p className="text-[10px] text-caption text-center">{c.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Typography ─── */}
      <Section title="Typography">
        <p className="text-[13px] text-body mb-[16px]">
          Two fonts: <strong>Source Serif 4</strong> for titles, <strong>Helvetica Neue</strong> for everything else.
        </p>
        <div className="bg-card rounded-card p-[20px] flex flex-col gap-[12px]">
          <p className="text-[28px] text-foreground leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
            Article Title
          </p>
          <p className="text-[20px] text-foreground leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
            Card Heading
          </p>
          <p className="text-[14px] text-body">
            Body text looks like this. It uses Helvetica Neue at 14px with slightly reduced opacity for readability.
          </p>
          <p className="text-[12px] text-caption">Caption — used for dates, categories, and metadata</p>
          <p className="text-[12px] text-muted">Muted — used for secondary information</p>
        </div>
      </Section>

      {/* ─── Emoji Usage ─── */}
      <Section title="Emoji Usage">
        <p className="text-[13px] text-body mb-[16px]">
          Emojis are used throughout the UI instead of custom icons for a playful, universal feel.
        </p>
        <div className="bg-card rounded-card p-[20px] flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[8px] text-[14px]">
            <div className="flex justify-between"><span className="text-body">Navigation</span><span>🏠 🗞️ ✉️</span></div>
            <div className="flex justify-between"><span className="text-body">App metrics</span><span>💰 ⭐ 📱</span></div>
            <div className="flex justify-between"><span className="text-body">User acquisition</span><span>👥 📲 ⬇️ 🔑 💬 📊</span></div>
            <div className="flex justify-between"><span className="text-body">Contact</span><span>📫 ☎️</span></div>
            <div className="flex justify-between"><span className="text-body">Countries</span><span>🇺🇸 🇩🇪 🇬🇧 🇪🇸</span></div>
          </div>
        </div>
      </Section>

      {/* ─── Buttons ─── */}
      <Section title="Buttons">
        <p className="text-[13px] text-body mb-[16px]">
          Two button styles used across the site. Both use pill-shaped corners.
        </p>
        <div className="flex flex-col gap-[16px]">
          <div className="flex items-center gap-[16px]">
            <span className="bg-primary text-primary-text flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] shrink-0">
              Want to Buy?
            </span>
            <p className="text-[12px] text-caption">Primary — calls to action, active nav</p>
          </div>
          <div className="flex items-center gap-[16px]">
            <span className="bg-glass backdrop-blur-[12px] text-foreground flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] shrink-0">
              See more Apps
            </span>
            <p className="text-[12px] text-caption">Glass — secondary actions, inactive nav</p>
          </div>
        </div>
      </Section>

      {/* ─── Tags ─── */}
      <Section title="Tags">
        <p className="text-[13px] text-body mb-[16px]">
          Small pill-shaped labels used for app stats, categories, and metadata.
        </p>
        <div className="flex flex-col gap-[10px]">
          <div className="flex flex-wrap gap-[6px]">
            <span className="bg-tag text-foreground px-[10px] py-[4px] rounded-pill text-[12px]">Social</span>
            <span className="bg-tag text-foreground px-[10px] py-[4px] rounded-pill text-[12px]">Productivity</span>
            <span className="bg-tag text-foreground px-[10px] py-[4px] rounded-pill text-[12px]">Fitness</span>
          </div>
          <p className="text-[11px] text-caption">Category tags</p>
          <div className="flex flex-wrap gap-[5px]">
            <span className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill text-[12px]">💰$12k mrr</span>
            <span className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill text-[12px]">⭐ 4.8</span>
            <span className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill text-[12px]">📱 85k</span>
          </div>
          <p className="text-[11px] text-caption">Metric tags (app cards)</p>
        </div>
      </Section>

      {/* ─── Navigation ─── */}
      <Section title="Navigation">
        <p className="text-[13px] text-body mb-[16px]">
          Always visible at the top. Active page = primary, others = glass. Emojis label each section.
        </p>
        <div className="flex gap-[10px]">
          <span className="bg-primary text-primary-text flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px]">
            🏠 Home
          </span>
          <span className="bg-glass backdrop-blur-[12px] text-foreground flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px]">
            🗞️ News
          </span>
          <span className="bg-glass backdrop-blur-[12px] text-foreground flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px]">
            ✉️ Contact
          </span>
        </div>
      </Section>

      {/* ─── App Listing Card ─── */}
      <Section title="App Listing Card">
        <p className="text-[13px] text-body mb-[16px]">
          How apps appear in the gallery. Shows icon, name, subtitle, and key metrics at a glance.
        </p>
        <div className="bg-card flex items-center p-[15px] rounded-card">
          <div className="flex flex-[1_0_0] gap-[10px] items-center">
            <div className="relative shrink-0 size-[100px] rounded-icon shadow-icon overflow-hidden bg-tag flex items-center justify-center">
              <span className="text-[40px]">📱</span>
            </div>
            <div className="flex flex-[1_0_0] flex-col h-full items-start justify-between min-h-[100px]">
              <div className="flex items-start justify-between w-full">
                <div className="flex flex-col gap-[4px] items-start leading-[1.2]">
                  <p className="font-bold text-[20px]">App Name</p>
                  <p className="text-[12px]">Short description of the app</p>
                </div>
                <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0">
                  <span className="text-[12px] leading-[1.2]">More</span>
                </div>
              </div>
              <div className="flex gap-[5px] items-center">
                <span className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill text-[12px]">💰$12k mrr</span>
                <span className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill text-[12px]">📱 iOS</span>
                <span className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill text-[12px]">⭐ 4.8</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── App Detail Card ─── */}
      <Section title="App Detail Page">
        <p className="text-[13px] text-body mb-[16px]">
          Full app detail lives inside a card. Sections stack vertically: header, about, links, highlights, screenshots, acquisition channels, opportunities, FAQ, and contact.
        </p>
        <div className="bg-card rounded-card p-[15px] flex flex-col gap-[20px]">
          {/* Header */}
          <div className="flex gap-[10px] items-center w-full">
            <div className="relative shrink-0 size-[80px] rounded-icon shadow-icon overflow-hidden bg-tag flex items-center justify-center">
              <span className="text-[32px]">📱</span>
            </div>
            <div className="flex flex-col gap-[6px] flex-1">
              <div className="flex items-start justify-between">
                <div className="leading-[1.2]">
                  <p className="font-bold text-[20px]">App Name</p>
                  <p className="text-[12px]">Subtitle goes here</p>
                </div>
                <span className="bg-primary text-primary-text flex h-[27px] items-center justify-center p-[10px] rounded-pill text-[12px]">Close</span>
              </div>
              <div className="flex gap-[5px]">
                <span className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill text-[12px]">💰$12k</span>
                <span className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill text-[12px]">⭐ 4.8</span>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="leading-[1.2]">
            <p className="font-bold text-[20px] mb-[8px]">About</p>
            <p className="text-[17px]">Description of the app, what it does, and why it&apos;s valuable.</p>
          </div>

          {/* Store Links */}
          <div className="flex gap-[10px]">
            <span className="bg-primary text-primary-text flex gap-[10px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px]">App Store ↗</span>
            <span className="bg-primary text-primary-text flex gap-[10px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px]">Play Store ↗</span>
          </div>

          {/* Highlights */}
          <div className="leading-[1.2]">
            <p className="font-bold text-[20px] mb-[12px]">Highlights</p>
            <div className="flex items-start justify-between text-center">
              <div className="flex flex-col gap-[6px] items-center flex-1">
                <p className="text-[20px]">💰</p>
                <p className="font-bold text-[20px]">$12k</p>
                <p className="text-[12px] text-muted">Monthly Revenue</p>
              </div>
              <div className="flex flex-col gap-[6px] items-center flex-1">
                <p className="text-[20px]">⭐</p>
                <p className="font-bold text-[20px]">4.8</p>
                <p className="text-[12px] text-muted">App Store Rating</p>
              </div>
              <div className="flex flex-col gap-[6px] items-center flex-1">
                <p className="text-[20px]">📱</p>
                <p className="font-bold text-[20px]">85k</p>
                <p className="text-[12px] text-muted">Active Users</p>
              </div>
            </div>
          </div>

          {/* Acquisition Channel */}
          <div className="leading-[1.2]">
            <p className="font-bold text-[20px] mb-[8px]">User Acquisition</p>
            <div className="flex gap-[18px] h-[75px] items-center w-full">
              <div className="shrink-0 size-[75px] bg-tag rounded-icon flex items-center justify-center">
                <span className="text-[24px]">📢</span>
              </div>
              <div className="flex flex-[1_0_0] items-center justify-between">
                <div className="flex flex-col gap-[5px]">
                  <p className="text-[17px]">Channel Name</p>
                  <p className="text-[12px]">Subtitle</p>
                </div>
                <span className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill text-[12px]">$2.4k/mo</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="leading-[1.2]">
            <p className="font-bold text-[20px] mb-[4px]">Interested?</p>
            <p className="text-[17px] mb-[10px]">Reach out or book a call with your POC</p>
            <div className="flex gap-[10px] items-center">
              <div className="size-[80px] rounded-icon shadow-icon bg-tag shrink-0 flex items-center justify-center">
                <span className="text-[32px]">👤</span>
              </div>
              <div className="flex flex-col gap-[10px] flex-1">
                <span className="bg-primary text-primary-text flex items-center justify-center px-[15px] py-[10px] rounded-pill text-[14px]">📫 email@ehvm.com</span>
                <span className="bg-primary text-primary-text flex items-center justify-center px-[15px] py-[10px] rounded-pill text-[14px]">☎️ +1 234 567 890</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── App Icons ─── */}
      <Section title="Floating Icons">
        <p className="text-[13px] text-body mb-[16px]">
          Used on home and news pages. They float, drift, and respond to mouse movement. Rounded corners (21px) with a soft layered shadow.
        </p>
        <div className="flex gap-[20px] items-end">
          <div className="flex flex-col items-center gap-[8px]">
            <div className="size-[80px] bg-card rounded-icon shadow-icon" />
            <p className="text-[11px] text-caption">80px (mobile)</p>
          </div>
          <div className="flex flex-col items-center gap-[8px]">
            <div className="size-[100px] bg-card rounded-icon shadow-icon" />
            <p className="text-[11px] text-caption">100px (desktop)</p>
          </div>
        </div>
      </Section>

      {/* ─── Corner Radius ─── */}
      <Section title="Corner Radius">
        <div className="flex flex-wrap gap-[20px] items-end">
          {[
            { label: "Card — 33px", r: "rounded-card", w: "80px", h: "80px" },
            { label: "Icon — 21px", r: "rounded-icon", w: "80px", h: "80px" },
            { label: "Pill — full", r: "rounded-pill", w: "140px", h: "50px" },
          ].map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-[8px]">
              <div className={`bg-card border border-divider ${r.r}`} style={{ width: r.w, height: r.h }} />
              <p className="text-[11px] text-caption">{r.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── News List Item ─── */}
      <Section title="News List Item">
        <p className="text-[13px] text-body mb-[16px]">
          How articles appear in the news feed. Illustrations use contain fit with a light thumbnail background. Photos fill the icon edge-to-edge.
        </p>
        <div className="flex flex-col gap-[13px]">
          {[
            { title: "EHVM Europe Tour with 8 stops", cat: "Event", img: "/images/eu-stars.png", contain: true },
            { title: "How Jane Doe built and sold Notey", cat: "Story", img: "/images/jane-doe.png", contain: false },
          ].map((a) => (
            <div key={a.title} className="flex gap-[18px] items-center">
              <div className={`relative shrink-0 size-[75px] rounded-icon overflow-hidden ${a.contain ? "bg-thumbnail" : ""}`}>
                <Image src={a.img} alt="" fill className={a.contain ? "object-contain p-[4px]" : "object-cover"} />
              </div>
              <div className="flex flex-col gap-[5px]">
                <p className="text-[20px] text-foreground leading-none" style={{ fontFamily: "var(--font-serif)" }}>{a.title}</p>
                <p className="text-[12px] text-caption">{a.cat}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-[40px]">
      <h2 className="text-[20px] text-foreground mb-[14px]" style={{ fontFamily: "var(--font-serif)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
