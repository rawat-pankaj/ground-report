/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // A YouTube thumbnail for a given video id does not change, so keep optimized
    // copies for 30 days (the default is 60 seconds) to avoid re-processing them.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
    ],
  },
  async headers() {
    // Note on script-src: Next.js's App Router injects inline <script> tags
    // for hydration data, so 'unsafe-inline' is required here. That does
    // limit this CSP's value against XSS specifically — a nonce-based policy
    // would be stronger but needs a nonce threaded through proxy.js and every
    // render. The directives that ARE doing real work regardless:
    // frame-ancestors (clickjacking, matters most for /admin), object-src,
    // base-uri, form-action, and blocking all third-party script/style origins.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: https://i.ytimg.com https://yt3.ggpht.com https://yt3.googleusercontent.com",
      "connect-src 'self'",
      // The video page embeds the privacy-enhanced YouTube player.
      "frame-src https://www.youtube-nocookie.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Self-hosted fonts never change under the same file name (a new version
        // gets a new name), so browsers and the CDN can keep them for a year.
        source: "/fonts/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
