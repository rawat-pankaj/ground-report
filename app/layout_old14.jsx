import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import MastheadNav from "./MastheadNav";

export const metadata = {
  title: "PeopleLens — independent journalism, curated",
  description: "A hand-curated feed of independent YouTube journalists.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="masthead">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="masthead-mark">
              PeopleLens
            </a>
            <MastheadNav />
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 pt-4 pb-8">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
