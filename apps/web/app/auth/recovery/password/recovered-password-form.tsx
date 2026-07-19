"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, FormField, Input, Notice } from "@xwlc/ui";
import { updateRecoveredPassword, type RecoveredPasswordState } from "@/modules/platform/auth/actions";

type Labels = { confirm: string; failed: string; hint: string; mismatch: string; password: string; returnToProduct: string; save: string; saving: string; success: string; tooShort: string };

export function RecoveredPasswordForm({ labels, next }: { labels: Labels; next: string }) {
  const [state, action, pending] = useActionState<RecoveredPasswordState, FormData>(updateRecoveredPassword, null);
  return <form action={action} className="form">
    <input type="hidden" name="next" value={next} />
    <FormField id="recovery-password" label={labels.password} hint={labels.hint} error={state?.ok === false && state.error === "password_invalid" ? labels.tooShort : undefined}>
      <Input name="password" type="password" autoComplete="new-password" minLength={8} required disabled={state?.ok === true} />
    </FormField>
    <FormField id="recovery-confirm-password" label={labels.confirm} error={state?.ok === false && state.error === "password_mismatch" ? labels.mismatch : undefined}>
      <Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required disabled={state?.ok === true} />
    </FormField>
    {state?.ok === false && state.error === "password_update_failed" ? <Notice variant="error">{labels.failed}</Notice> : null}
    {state?.ok === true ? <Notice variant="success">{labels.success}</Notice> : null}
    {state?.ok === true ? <Link className="button button-primary button-medium" href={state.next}>{labels.returnToProduct}</Link> : <Button type="submit" loading={pending} loadingLabel={labels.saving}>{labels.save}</Button>}
  </form>;
}
