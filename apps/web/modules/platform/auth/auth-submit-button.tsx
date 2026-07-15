"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@xwlc/ui";

export function AuthSubmitButton({ label, pendingLabel, disabled = false }: { label: string; pendingLabel: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <Button disabled={disabled || pending} loading={pending} loadingLabel={pendingLabel} type="submit">{label}</Button>;
}
