import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "Ground Report — independent journalism, curated",
  description: "A hand-curated feed of independent YouTube journalists.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="masthead">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="masthead-mark">
              Ground Report
            </a>
            <nav className="masthead-nav flex items-center gap-5">
              <a href="/suggest">Suggest</a>
              <a href="/admin">Admin</a>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
