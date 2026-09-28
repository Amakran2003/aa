"use client";

import { useState } from "react";

export function Gallery({ images }: { images: string[] }) {
  const [broken, setBroken] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const shown = images.filter((image) => !broken.includes(image));
  const current = picked && shown.includes(picked) ? picked : shown[0];
  if (!current) {
    return <div className="aspect-[4/3] w-full rounded-[var(--abk-rayon-bouton-large)] bg-[var(--abk-brume)]" aria-hidden="true" />;
  }
  const drop = (image: string) => setBroken((list) => (list.includes(image) ? list : [...list, image]));
  return (
    <div className="min-w-0">
      <div className="overflow-hidden rounded-[var(--abk-rayon-bouton-large)] border border-[var(--abk-bordure-clair)] bg-blanc">
        <img
          key={current}
          src={current}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => drop(current)}
          className="aspect-[4/3] w-full object-contain p-2"
        />
      </div>
      {shown.length > 1 ? (
        <ul className="carousel mt-2" aria-label="Photos du produit">
          {shown.map((image, position) => (
            <li key={image} className="shrink-0">
              <button
                type="button"
                aria-label={`Photo ${position + 1}`}
                aria-pressed={image === current}
                onClick={() => setPicked(image)}
                className={`block h-14 w-14 overflow-hidden rounded-xl border-2 bg-blanc ${
                  image === current ? "border-signal" : "border-transparent hover:border-[var(--abk-bordure-clair)]"
                }`}
              >
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => drop(image)}
                  className="h-full w-full object-contain"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
