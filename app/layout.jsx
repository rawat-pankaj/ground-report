import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import MastheadBar from "./MastheadBar";

export const metadata = {
  metadataBase: new URL("https://www.peoplelens.in"),
  title: "PeopleLens",
  description: "A hand-curated feed of independent YouTube journalists.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "PeopleLens",
    description: "A hand-curated feed of independent YouTube journalists.",
    url: "https://www.peoplelens.in",
    siteName: "PeopleLens",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PeopleLens",
    description: "A hand-curated feed of independent YouTube journalists.",
  },
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
        <SpeedInsights />
      </body>
    </html>
  );
}
