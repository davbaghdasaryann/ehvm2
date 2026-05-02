"use client";

import { usePathname } from "next/navigation";

export default function SiteAttribution() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="w-full flex justify-end px-[8px] pb-[6px] pt-0">
      <a
        href="https://luphar.org"
        target="_blank"
        rel="noopener"
        aria-label="Website by Luphar"
        className="cursor-default text-[7px] leading-none text-caption no-underline opacity-10 focus-visible:opacity-80 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-current"
      >
        Luphar
      </a>
    </footer>
  );
}
