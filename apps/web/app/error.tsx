"use client";
import { useEffect, useState } from "react";
import { StatePanel } from "@xwlc/ui";
import { platformMessages, type AppLocale } from "@/modules/platform/i18n/messages";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [locale, setLocale] = useState<AppLocale>("en-US");
  useEffect(() => setLocale(document.documentElement.lang === "zh-CN" ? "zh-CN" : "en-US"), []);
  const messages = platformMessages[locale];
  return <div className="page"><StatePanel kind="error" kindLabel={messages.stateError} title={messages.somethingWrong} description={messages.somethingWrongDescription} /><button className="button" onClick={reset}>{messages.tryAgain}</button></div>;
}
