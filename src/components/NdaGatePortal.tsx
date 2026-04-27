"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DocusealForm } from "@docuseal/react";

type Step = "gate" | "form" | "done" | "signed";

const SESSION_KEY = "nda_signed";

export default function NdaGatePortal({ ndaUrl }: { ndaUrl: string }) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("gate");

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setStep("signed");
    }
  }, []);

  if (!mounted) return null;

  function handleComplete() {
    sessionStorage.setItem(SESSION_KEY, "true");
    setStep("done");
  }

  return createPortal(
    <>
      {/* Gate card */}
      {step === "gate" && (
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
            <button
              onClick={() => setStep("form")}
              className="flex items-center gap-[8px] px-[24px] py-[11px] rounded-pill text-[16px] leading-normal text-white cursor-pointer border-none"
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
            </button>
          </div>
        </div>
      )}

      {/* DocuSeal form modal */}
      {step === "form" && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div
            className="relative w-full max-w-[720px] mx-4 rounded-[24px] overflow-hidden"
            style={{ maxHeight: "90vh", background: "#fff" }}
          >
            <button
              onClick={() => setStep("gate")}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer border-none text-black"
              style={{ background: "rgba(0,0,0,0.08)" }}
              aria-label="Close"
            >
              ✕
            </button>
            <div style={{ overflowY: "auto", maxHeight: "90vh" }}>
              <DocusealForm
                src={ndaUrl}
                withTitle={false}
                onComplete={handleComplete}
              />
            </div>
          </div>
        </div>
      )}

      {/* Success popup */}
      {step === "done" && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div
            className="rounded-[28px] px-[48px] py-[40px] flex flex-col items-center gap-[16px] text-center"
            style={{
              background: "#fff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
              maxWidth: 380,
            }}
          >
            <div
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-[28px]"
              style={{ background: "#f0fdf4" }}
            >
              ✅
            </div>
            <p className="font-bold text-[22px] leading-[1.2] text-black m-0">NDA signed!</p>
            <p className="text-[15px] leading-[1.5] m-0" style={{ color: "#555" }}>
              Thank you. You&apos;ll receive a confirmation email shortly with your signed copy and access details.
            </p>
            <button
              onClick={() => setStep("signed")}
              className="mt-2 px-[28px] py-[10px] rounded-pill text-[15px] font-medium text-white cursor-pointer border-none"
              style={{ background: "#1a1a1a" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Signed state — persistent card replacing gate */}
      {step === "signed" && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none mt-[15vh]">
          <div
            className="pointer-events-auto rounded-[28px] px-[36px] py-[32px] flex flex-col items-center gap-[10px] text-center"
            style={{
              background: "rgba(255, 255, 255, 0.35)",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.10), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            <p className="text-[22px] m-0">✉️</p>
            <p className="font-bold text-[18px] leading-[1.2] text-black m-0">NDA submitted</p>
            <p className="text-[14px] leading-[1.5] m-0" style={{ color: "#555" }}>
              Check your email for the signed copy and access details.
            </p>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
