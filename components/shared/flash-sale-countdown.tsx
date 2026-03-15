"use client";

import { useEffect, useState } from "react";

function computeDiff(endsAt: string) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

export function FlashSaleCountdown({ endsAt }: { endsAt: string }) {
  const [diff, setDiff] = useState(() => computeDiff(endsAt));

  useEffect(() => {
    const id = setInterval(() => setDiff(computeDiff(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!diff) return <span className="text-xs font-medium opacity-70">Ended</span>;

  return (
    <span className="tabular-nums font-bold tracking-wider">
      {diff.h}h : {diff.m}m : {diff.s}s
    </span>
  );
}
