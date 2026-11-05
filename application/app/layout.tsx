import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusIQ | CampusPulse AI",
  description: "Occupancy-aware energy intelligence for smarter campuses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
