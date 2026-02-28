import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import "./globals.css";
import NavPills from "@/components/NavPills";
import ThemeProvider from "@/components/ThemeProvider";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EHVM Apps Capital",
  description: "Connecting app sellers and app builders",
};

const themeScript = `(function(){try{var t=localStorage.getItem("ehvm-theme");if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`antialiased ${sourceSerif.variable}`}>
        <ThemeProvider>
          <div className="min-h-[100dvh] flex flex-col items-center overflow-hidden">
            <NavPills />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
