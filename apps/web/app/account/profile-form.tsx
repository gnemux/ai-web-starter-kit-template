"use client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, FormField, Input, Toast } from "@xwlc/ui";
import { updateProfile, type ProfileActionState } from "@/modules/platform/auth/actions";

const initialState: ProfileActionState = { status: "idle", message: "" };

export function ProfileForm({ initialName, completionNext, labels }: { initialName: string; completionNext?: string; labels: { displayName: string; displayNameHint: string; save: string; saving: string; success: string; error: string; dismiss: string } }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateProfile, initialState);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => { if (pending) setDismissed(false); }, [pending]);
  useEffect(() => { if (state.status === "success" && completionNext) router.replace(completionNext); }, [completionNext, router, state.status]);
  return <><form action={action} className="form">
    {completionNext ? <input type="hidden" name="requireDisplayName" value="1" /> : null}
    <FormField id="display-name" label={labels.displayName} hint={labels.displayNameHint} error={state.status === "error" ? labels.error : undefined}>
      <Input name="displayName" defaultValue={initialName} maxLength={120} autoComplete="name" />
    </FormField>
    <Button disabled={pending} loading={pending} loadingLabel={labels.saving} type="submit">{labels.save}</Button>
  </form><Toast dismissLabel={labels.dismiss} open={state.status === "success" && !dismissed} onDismiss={() => setDismissed(true)}>{labels.success}</Toast></>;
}
