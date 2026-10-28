import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center">
        <nav className="site-footer-nav" aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/suggest">Suggest a video</Link>
        </nav>
        <p className="site-footer-note">
          Every video belongs to its creator and plays from YouTube. PeopleLens only links to it and adds context.
        </p>
        <p className="site-footer-copy">© {new Date().getFullYear()} PeopleLens</p>
      </div>
    </footer>
  );
}
