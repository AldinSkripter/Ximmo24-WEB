"use client";

import { useState, useEffect } from "react";
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
}) {
  const webSettings = useSelector((state) => state.WebSetting?.data);
  const fallbackSrc = normalizeSrc(webSettings?.web_placeholder_logo || DefaultLogo);
  const realSrc = normalizeSrc(src);

  const [currentSrc, setCurrentSrc] = useState(blurDataURL || fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);

  // preload real image
  useEffect(() => {
    if (!realSrc) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }

    const img = new window.Image();
    img.src = realSrc;

    img.onload = () => {
      setCurrentSrc(realSrc);
      setIsLoading(false);
    };

    img.onerror = () => {
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
    };
  }, [realSrc, fallbackSrc]);

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
      className={`${isPlaceholder ? "opacity-40 !object-contain" : ""} ${className} `}
    />
  );
}
