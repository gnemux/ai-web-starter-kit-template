"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";

export function Dialog({ open, onOpenChange, title, description, closeLabel, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; closeLabel: string; children?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) { returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; dialog.showModal(); }
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog aria-describedby={descriptionId} aria-labelledby={titleId} className="ui-dialog" onCancel={(event) => { event.preventDefault(); onOpenChange(false); }} onClose={() => { onOpenChange(false); returnFocus.current?.focus(); }} ref={ref}>
    <button aria-label={closeLabel} className="dialog-close" onClick={() => onOpenChange(false)} type="button">×</button><h2 id={titleId}>{title}</h2><p id={descriptionId}>{description}</p>{children}
  </dialog>;
}
