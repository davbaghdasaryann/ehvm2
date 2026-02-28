"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "🏠 Home", href: "/" },
  { label: "🗞️ News", href: "/news" },
  { label: "✉️ Contact", href: "/contact" },
];

export default function NavPills() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const id = window.setTimeout(() => {
      router.prefetch("/");
      router.prefetch("/apps");
      router.prefetch("/news");
      router.prefetch("/contact");
    }, 120);

    return () => {
      window.clearTimeout(id);
    };
  }, [router]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/apps");
    if (href === "/contact") return pathname.startsWith("/contact") || pathname.startsWith("/story");
    return pathname.startsWith(href);
  }

  return (
    <nav className="relative z-20 flex gap-[10px] items-center pt-[38px] pb-[18px]">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill shrink-0 text-[17px] leading-normal no-underline ${
            isActive(item.href)
              ? "bg-primary text-primary-text"
              : "bg-glass backdrop-blur-[12px] text-foreground"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
