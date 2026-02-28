"use client";

import { useState } from "react";
import Image from "next/image";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const TIMES = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarWidget({
  hostName,
  hostImage,
  title = "M&A Questions",
  duration = "15m",
  platform = "Google Meet",
  timezone = "Europe/Berlin",
}: {
  hostName: string;
  hostImage: string;
  title?: string;
  duration?: string;
  platform?: string;
  timezone?: string;
}) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthName = new Date(currentYear, currentMonth).toLocaleString("en", { month: "long" });
  const today = now.getDate();
  const isCurrentMonth = currentMonth === now.getMonth() && currentYear === now.getFullYear();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  return (
    <div className="bg-tag rounded-icon p-[20px] flex flex-col gap-[16px] w-full">
      {/* Host info */}
      <div className="flex items-center gap-[10px]">
        <div className="relative size-[32px] rounded-full overflow-hidden shrink-0">
          <Image src={hostImage} alt={hostName} fill className="object-cover" />
        </div>
        <span className="text-[14px] text-muted">{hostName}</span>
      </div>

      {/* Title */}
      <p className="font-bold text-[20px] leading-[1.2]">{title}</p>

      {/* Details */}
      <div className="flex flex-col gap-[6px] text-[14px] text-body">
        <div className="flex items-center gap-[6px]">
          <span>🕐</span>
          <span>{duration}</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <span>📹</span>
          <span>{platform}</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <span>🌐</span>
          <span>{timezone} ▾</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex flex-col gap-[8px]">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-[17px]">
            {monthName} {currentYear}
          </span>
          <div className="flex gap-[12px]">
            <button onClick={prevMonth} className="text-faint hover:text-foreground text-[18px]">‹</button>
            <button onClick={nextMonth} className="text-faint hover:text-foreground text-[18px]">›</button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-[2px] text-center text-[11px] text-caption font-medium">
          {DAYS.map((d) => (
            <div key={d} className="py-[4px]">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-[2px] text-center text-[14px]">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isPast = isCurrentMonth && day < today;
            const isSelected = selectedDay === day;
            const isToday = isCurrentMonth && day === today;

            return (
              <button
                key={day}
                disabled={isPast}
                onClick={() => setSelectedDay(day)}
                className={`py-[6px] rounded-full text-[14px] transition-colors
                  ${isPast ? "text-faint cursor-default" : "hover:bg-card cursor-pointer"}
                  ${isSelected ? "bg-primary text-primary-text hover:bg-primary" : ""}
                  ${isToday && !isSelected ? "font-bold" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots — show when a day is selected */}
      {selectedDay && (
        <div className="flex flex-col gap-[8px]">
          <p className="text-[14px] text-muted">
            Available times for {monthName} {selectedDay}
          </p>
          <div className="grid grid-cols-2 gap-[8px]">
            {TIMES.map((time) => (
              <button
                key={time}
                className="border border-divider rounded-[10px] py-[10px] text-[14px] hover:bg-primary hover:text-primary-text transition-colors cursor-pointer"
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
