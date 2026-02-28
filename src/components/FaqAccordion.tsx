"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer?: string;
};

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-[10px] w-full">
      <p className="font-bold text-[20px] leading-[1.2]">FAQs</p>
      {faqs.map((faq, i) => {
        const isOpen = openIndexes.has(i);
        const hasAnswer = !!faq.answer;

        return (
          <div key={i} className="flex flex-col">
            <button
              onClick={() => hasAnswer && toggle(i)}
              className={`flex items-start gap-[8px] text-left font-bold text-[17px] leading-normal py-[6px] ${hasAnswer ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className="inline-block transition-transform duration-200 shrink-0 mt-[2px]"
                style={{ transform: hasAnswer && isOpen ? "rotate(0deg)" : hasAnswer ? "rotate(-90deg)" : "none" }}
              >
                {hasAnswer ? "⬇️" : "➡️"}
              </span>
              <span>{faq.question}</span>
            </button>
            {hasAnswer && (
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: isOpen ? "500px" : "0px",
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <p className="text-[17px] leading-[1.4] pl-[30px] pb-[6px] whitespace-pre-line">{faq.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
