"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function NdaGatePortal({ ndaUrl }: { ndaUrl: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none mt-[15vh]">
      <div
        className="pointer-events-auto rounded-[28px] px-[36px] py-[32px] flex flex-col items-center gap-[18px] text-center"
        style={{
          background: "rgba(255, 255, 255, 0.35)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.10), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        <p className="font-bold text-[20px] leading-[1.2] text-black">Sign NDA and get full access</p>
        <a
          href={ndaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-[8px] px-[24px] py-[11px] rounded-pill text-[16px] no-underline leading-normal text-white"
          style={{ background: "#1a1a1a" }}
        >
          Start{" "}
          <svg width="18" height="18" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#nda-lock)">
              <path d="M21.375 14.1289H5.625C4.38236 14.1289 3.375 15.1363 3.375 16.3789V24.2539C3.375 25.4965 4.38236 26.5039 5.625 26.5039H21.375C22.6176 26.5039 23.625 25.4965 23.625 24.2539V16.3789C23.625 15.1363 22.6176 14.1289 21.375 14.1289Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.875 14.1307V9.63067C7.8736 8.23572 8.39057 6.89002 9.32555 5.85479C10.2605 4.81957 11.5468 4.16868 12.9347 4.02849C14.3226 3.8883 15.713 4.26881 16.8362 5.09614C17.9593 5.92348 18.7349 7.13862 19.0125 8.50567" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <defs>
              <clipPath id="nda-lock">
                <rect width="27" height="27" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        </a>
      </div>
    </div>,
    document.body
  );
}
