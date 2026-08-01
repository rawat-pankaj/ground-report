import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import MastheadBar from "./MastheadBar";

export const metadata = {
  title: "PeopleLens",
  description: "A hand-curated feed of independent YouTube journalists.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="masthead">
          <MastheadBar />
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-8">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
