"use client";

import { useState } from "react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked (permissions, insecure context). Fall back
      // to selecting nothing rather than throwing; the URL bar still works.
    }
  }

  return (
    <button type="button" className="btn btn-outline" onClick={copy}>
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}
