import "./fonts.css";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import MastheadBar from "./MastheadBar";
import Footer from "./Footer";

export const metadata = {
  metadataBase: new URL("https://www.peoplelens.in"),
  title: "PeopleLens — Independent Ground Reporting from India",
  description:
    "Hand-picked ground reports from independent Indian journalists on YouTube — covering education, corruption, infrastructure, protests and the issues that affect ordinary people. In Hindi and English. Curated by hand, not by algorithm.",
  keywords: [
    "independent journalism India",
    "ground report India",
    "Hindi news videos",
    "Indian independent journalists",
    "curated news India",
  ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "PeopleLens — Independent Ground Reporting from India",
    description:
      "Hand-picked ground reports from independent Indian journalists on YouTube. Curated by hand, not by algorithm.",
    url: "https://www.peoplelens.in",
    siteName: "PeopleLens",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PeopleLens — Independent Ground Reporting from India",
    description:
      "Hand-picked ground reports from independent Indian journalists on YouTube. Curated by hand, not by algorithm.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Fetch the fonts every page needs early (the Devanagari one is preloaded because most titles are Hindi). */}
        {[
          "ibm-plex-sans-latin",
          "archivo-narrow-latin",
          "ibm-plex-mono-latin",
          "ibm-plex-sans-devanagari-devanagari-600",
        ].map((name) => (
          <link key={name} rel="preload" href={`/fonts/${name}.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
      </head>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <header className="masthead">
          <MastheadBar />
        </header>
        <main id="main" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-8">{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
