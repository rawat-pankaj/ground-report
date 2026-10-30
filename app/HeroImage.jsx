"use client";

import { useState } from "react";
import Image from "next/image";

// The featured story's thumbnail, served through the Next.js image optimizer
// (a WebP sized to the screen, about 25-65 KB) instead of YouTube's 1280x720 JPEG
// (about 215 KB). Only this one image goes through the optimizer, so it stays far
// below the free plan's monthly limit on source images.
//
// Not every video has a maxresdefault thumbnail on YouTube; when it is missing,
// fall back to hqdefault (4:3 with black bars, which object-cover crops away).
export default function HeroImage({ videoId }) {
  const [src, setSrc] = useState(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);

  return (
    <Image
      src={src}
      alt=""
      width={1280}
      height={720}
      sizes="(min-width: 1024px) 560px, 100vw"
      quality={75}
      loading="eager"
      fetchPriority="high"
      className="w-full object-cover"
      style={{ aspectRatio: "16/9" }}
      onError={() => setSrc(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)}
    />
  );
}
