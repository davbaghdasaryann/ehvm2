"use client";

import { useEffect } from "react";

export default function CalendarEmbed({ calendarUrl }: { calendarUrl: string }) {
  useEffect(() => {
    // Extract cal link from URL if it's a full URL
    let calLink = calendarUrl;
    if (calendarUrl.includes("cal.com/")) {
      const match = calendarUrl.match(/cal\.com\/([^?#]+)/);
      if (match) {
        calLink = match[1];
      }
    }

    // Initialize Cal.com using the same pattern as their embed code
    const initializeCal = () => {
      const C = window as any;
      const A = "https://app.cal.com/embed/embed.js";
      const L = "init";

      const p = function (a: any, ar: any) {
        if (!a.q) a.q = [];
        a.q.push(ar);
      };

      const d = C.document;

      C.Cal =
        C.Cal ||
        function () {
          const cal = C.Cal as any;
          const ar = Array.from(arguments);
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = [];
            const script = d.createElement("script");
            script.src = A;
            d.head.appendChild(script);
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api: any = function () {
              p(api, Array.from(arguments));
            };
            const namespace = ar[1];
            api.q = [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else {
              p(cal, ar);
            }
            return;
          }
          p(cal, ar);
        };

      // Initialize Cal
      C.Cal("init", "m-a", { origin: "https://app.cal.com" });

      // Add inline calendar
      C.Cal.ns["m-a"]("inline", {
        elementOrSelector: "#my-cal-inline-m-a",
        config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
        calLink: calLink,
      });

      // Configure UI
      C.Cal.ns["m-a"]("ui", { hideEventTypeDetails: false, layout: "month_view" });
    };

    // Run initialization
    if (typeof window !== "undefined") {
      initializeCal();
    }
  }, [calendarUrl]);

  return (
    <div
      style={{ width: "100%", minHeight: "600px" }}
      id="my-cal-inline-m-a"
    />
  );
}
