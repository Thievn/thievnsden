"use client";

import { useState } from "react";
import { COIN_PLACEHOLDER, geckoUrl, letters } from "@/lib/desks/logos";

export function CoinMark({
  symbol,
  iconUrl,
  size,
}: {
  symbol: string;
  iconUrl?: string | null;
  size: 20 | 32 | 48;
}) {
  const gecko = geckoUrl(symbol);
  const sources = [iconUrl, gecko, COIN_PLACEHOLDER].filter((item, index, all): item is string => {
    return Boolean(item) && all.indexOf(item) === index;
  });
  const sourceKey = sources.join("|");
  const [seen, setSeen] = useState(sourceKey);
  const [step, setStep] = useState(0);
  if (seen !== sourceKey) {
    setSeen(sourceKey);
    setStep(0);
  }
  if (step >= sources.length) {
    return (
      <span className="coin-fallback" style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }} aria-hidden="true">
        {letters(symbol)}
      </span>
    );
  }
  return (
    <img
      className="coin"
      src={sources[step]}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setStep((current) => current + 1)}
    />
  );
}
