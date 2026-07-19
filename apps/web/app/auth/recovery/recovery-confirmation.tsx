"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Button, Notice } from "@xwlc/ui";
import { continuePasswordRecovery, type RecoveryContinuationState } from "@/modules/platform/auth/actions";

type Labels = { continue: string; invalid: string; ready: string; requestNew: string; verifying: string };

export function RecoveryConfirmation({ labels, next }: { labels: Labels; next: string }) {
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [state, action, pending] = useActionState<RecoveryContinuationState, FormData>(continuePasswordRecovery, null);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get("token_hash");
    const type = fragment.get("type");
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
    const valid = type === "recovery" && Boolean(token) && token!.length >= 32 && token!.length <= 512 && /^[A-Za-z0-9._~-]+$/.test(token!);
    if (valid) setTokenHash(token);
    setReady(true);
  }, []);

  if (!ready) return <p aria-live="polite">{labels.verifying}</p>;
  if (!tokenHash || state?.ok === false) return <div className="form">
    <Notice variant="error">{labels.invalid}</Notice>
    <Link className="text-link" href={`/login?mode=reset&next=${encodeURIComponent(next)}`}>{labels.requestNew}</Link>
  </div>;
  return <form action={action} className="form">
    <input type="hidden" name="next" value={next} />
    <input type="hidden" name="tokenHash" value={tokenHash} />
    <Notice variant="success">{labels.ready}</Notice>
    <Button type="submit" loading={pending} loadingLabel={labels.verifying}>{labels.continue}</Button>
  </form>;
}
