import type { Metadata } from "next";
import "./globals.css";
import NavPills from "@/components/NavPills";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ehvmcapital.com"),
  title: {
    default: "EHVM Apps Capital | Buy and Sell Mobile Apps",
    template: "%s | EHVM Apps Capital",
  },
  description: "EHVM Apps Capital connects mobile app founders, buyers, and operators through curated acquisition opportunities.",
  authors: [{ name: "EHVM Apps Capital", url: "https://ehvmcapital.com" }],
  creator: "Luphar",
  publisher: "EHVM Apps Capital",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "EHVM Apps Capital",
    description: "Curated mobile app acquisition opportunities for buyers and founders.",
    url: "/",
    siteName: "EHVM Apps Capital",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "EHVM Apps Capital",
    description: "Curated mobile app acquisition opportunities for buyers and founders.",
  },
  other: {
    designer: "Luphar",
    "web-author": "Luphar",
    "built-by": "Luphar",
    "built-by-url": "https://luphar.org",
  },
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
        <link rel="author" href="https://luphar.org" />
        <link rel="designer" href="https://luphar.org" />
        <link rel="made" href="https://luphar.org" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <div className="min-h-[100dvh] w-full flex flex-col overflow-x-hidden">
            <NavPills />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
