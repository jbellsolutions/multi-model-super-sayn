import type { Metadata } from "next";
import { IBM_Plex_Mono, Orbitron, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Super Sayn Orchestrator",
  description:
    "Local-first AI orchestrator dashboard for planning, running, and packaging specialist agent teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--page-bg)] font-body text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
