"use client";

import { useState } from "react";

export function ProductImage({ src, className }: { src: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span aria-hidden="true" className={`${className} block bg-[var(--abk-bordure-clair)]`} />;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
