"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="relative block size-[80px] md:size-[100px] rounded-icon shadow-icon transition-transform hover:scale-110 cursor-pointer border-0 p-0 bg-card overflow-hidden"
    >
      <div className="relative size-full rounded-icon overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme === "light" ? "/images/moon.png" : "/images/sun.png"}
          alt={theme === "light" ? "Dark mode" : "Light mode"}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </button>
  );
}
