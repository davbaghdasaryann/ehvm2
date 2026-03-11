import type { Metadata } from "next";
import "./globals.css";
import NavPills from "@/components/NavPills";
import ThemeProvider from "@/components/ThemeProvider";

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
