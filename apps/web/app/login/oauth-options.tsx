"use client";

import { useEffect, useState } from "react";
import { Button, Notice } from "@xwlc/ui";

type Labels = { apple: string; appleDeferred: string; google: string; checking: string; unavailable: string; working: string };

export function OAuthOptions({ configured, error, labels, next }: { configured: boolean; error?: string; labels: Labels; next: string }) {
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(configured);
  const [pending, setPending] = useState(false);
  const [runtimeError, setRuntimeError] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const controller = new AbortController();
    fetch("/auth/oauth/start?provider=google", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : { available: false })
      .then((result: { available?: boolean }) => setAvailable(result.available === true))
      .catch(() => setAvailable(false))
      .finally(() => setChecking(false));
    return () => controller.abort();
  }, [configured]);

  const failed = runtimeError || error === "cancelled" || error === "callback_failed" || error === "provider_unavailable";
  return <section className="card oauth-options" aria-label={labels.google}>
    {failed ? <Notice variant="error">{labels.unavailable}</Notice> : null}
    <Button type="button" variant="secondary" disabled={!available || checking || pending} loading={pending} loadingLabel={labels.working} onClick={startGoogle}>
      {checking ? labels.checking : labels.google}
    </Button>
    <Button type="button" variant="secondary" disabled title={labels.appleDeferred}>{labels.apple}</Button>
    <p className="oauth-help">{labels.appleDeferred}</p>
  </section>;

  async function startGoogle() {
    setPending(true);
    setRuntimeError(false);
    const body = new FormData();
    body.set("provider", "google");
    body.set("next", next);
    try {
      const response = await fetch("/auth/oauth/start", { method: "POST", body });
      const result = await response.json() as { ok?: boolean; url?: string };
      if (!response.ok || !result.ok || !result.url) throw new Error("oauth_start_failed");
      const url = new URL(result.url);
      if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") throw new Error("unsafe_oauth_url");
      window.location.assign(url.toString());
    } catch {
      setRuntimeError(true);
      setPending(false);
    }
  }
}
