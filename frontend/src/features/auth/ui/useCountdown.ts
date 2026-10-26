"use client";

import { useEffect, useState } from "react";

/**
 * Seconds left until the code can be sent again (the backend allows one code per 60 s).
 */
export function useCountdown() {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return;

    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);

    return () => clearTimeout(timer);
  }, [left]);

  return { left, start: (seconds = 60) => setLeft(seconds) };
}

/** "Код уже отправлен. Новый код можно запросить через 42 сек." → 42 */
export function secondsFromMessage(message: string): number | null {
  const match = message.match(/(\d+)\s*сек/);

  return match ? Number(match[1]) : null;
}
