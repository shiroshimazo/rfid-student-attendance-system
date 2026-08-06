import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RFID Student Attendance System",
  description: "RFID-based attendance tracking for students, teachers, and administrators.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        {/* Poppins 400 (body) + Supreme 500 (headings) — Fontshare only, not on Google Fonts. */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=poppins@400&f[]=supreme@500&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
