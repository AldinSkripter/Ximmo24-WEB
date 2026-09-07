"use client";

import { useState } from "react";
import Image from "next/image";
import { useSelector } from "react-redux";
import DefaultLogo from "@/assets/logo.png";

const normalizeSrc = (v) => (typeof v === "object" ? v?.src : v);

export default function ImageWithPlaceholder({
  src,
  alt = "",
  height = 0,
  width = 0,
  fill = false,
  className = "",
  priority = false,
  blurDataURL,
  loading = "lazy",
  sizes,
  quality = 75,
  ...props
}) {
  const webSettings = useSelector((state) => state.WebSetting?.data);
  const fallbackSrc = normalizeSrc(webSettings?.web_placeholder_logo || DefaultLogo);
  const realSrc = normalizeSrc(src);

  const [failedSrc, setFailedSrc] = useState(null);
  const currentSrc = realSrc && failedSrc !== realSrc ? realSrc : fallbackSrc;

  const isPlaceholder = currentSrc === fallbackSrc;

  return (
    <Image
      src={currentSrc}
      alt={alt}
      {...(fill ? { fill: true } : { width, height })}
      placeholder={blurDataURL ? "blur" : undefined}
      blurDataURL={blurDataURL}
      loading={priority ? "eager" : loading}
      priority={priority}
      sizes={sizes}
      quality={quality}
      onError={() => setFailedSrc(realSrc)}
      className={`${isPlaceholder ? "opacity-40 !object-contain" : ""} ${className} `}
      {...props}
    />
  );
}
