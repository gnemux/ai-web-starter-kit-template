"use client";
import { useEffect, useState, type ReactNode } from "react";
import { CloseIcon } from "./icons";

export function Toast({ children, dismissLabel, open = true, duration = 4000, onDismiss }: { children: ReactNode; dismissLabel: string; open?: boolean; duration?: number; onDismiss?: () => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!open || !onDismiss || duration <= 0 || paused) return;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onDismiss, open, paused]);
  if (!open) return null;
  return <div aria-live="polite" className="toast" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }} onFocus={() => setPaused(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} role="status"><span>{children}</span>{onDismiss ? <button aria-label={dismissLabel} onClick={onDismiss} type="button"><CloseIcon /></button> : null}</div>;
}
