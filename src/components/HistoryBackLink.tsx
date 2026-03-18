"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type HistoryBackLinkProps = {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export default function HistoryBackLink({ href, className, style, children }: HistoryBackLinkProps) {
  const router = useRouter();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    let sameOriginReferrer = false;
    if (typeof document !== "undefined" && document.referrer) {
      try {
        sameOriginReferrer = new URL(document.referrer).origin === window.location.origin;
      } catch {
        sameOriginReferrer = false;
      }
    }

    if (sameOriginReferrer && window.history.length > 1) {
      event.preventDefault();
      router.back();
    }
  };

  return (
    <Link href={href} onClick={onClick} className={className} style={style}>
      {children}
    </Link>
  );
}
