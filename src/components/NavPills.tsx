"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Home", href: "/", emoji: "🏠" },
  { label: "Apps", href: "/apps", emoji: "" },
  { label: "Newsroom", href: "/news", emoji: "🗞️" },
  { label: "Contact", href: "/contact", emoji: "✉️" },
];

export default function NavPills() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const id = window.setTimeout(() => {
      router.prefetch("/");
      router.prefetch("/apps");
      router.prefetch("/news");
      router.prefetch("/contact");
    }, 120);

    return () => {
      window.clearTimeout(id);
    };
  }, [pathname, router]);

  if (pathname.startsWith("/admin")) return null;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/contact") return pathname.startsWith("/contact") || pathname.startsWith("/story");
    return pathname.startsWith(href);
  }

  return (
    <nav className="relative z-20 mx-auto pt-[38px] pb-[18px]">
      <div className="flex items-center gap-[2px] rounded-pill px-[6px] py-[6px] bg-tag">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex h-[36px] items-center justify-center gap-[6px] px-[14px] rounded-pill shrink-0 text-[15px] leading-normal no-underline transition-opacity duration-150 ${
              isActive(item.href)
                ? "bg-primary text-primary-text"
                : "text-foreground hover:opacity-60"
            }`}
          >
            {item.emoji && <span>{item.emoji}</span>}
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
