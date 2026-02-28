"use client";

type FilterTabsProps = {
  tabs: string[];
  active: string;
  onSelect: (tab: string) => void;
  center?: boolean;
};

export default function FilterTabs({ tabs, active, onSelect, center }: FilterTabsProps) {
  return (
    <div
      className={`flex gap-[10px] items-center overflow-x-auto w-full scrollbar-none px-[10px] ${center ? "justify-center" : ""}`}
      style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          className={`flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill shrink-0 text-[17px] leading-normal whitespace-nowrap ${
            active === tab
              ? "bg-primary text-primary-text"
              : "bg-glass backdrop-blur-[12px] text-foreground"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
