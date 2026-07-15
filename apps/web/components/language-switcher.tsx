"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { AppLocale } from "@/modules/platform/i18n/messages";

export function LanguageSwitcher({ locale, label, english, chinese }: { locale: AppLocale; label: string; english: string; chinese: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const change = (next: AppLocale) => {
    document.cookie = `xwlc_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    startTransition(() => router.refresh());
  };
  return <div aria-label={label} className="language-switcher" role="group">
    <button aria-pressed={locale === "en-US"} disabled={pending} onClick={() => change("en-US")} type="button">{english}</button>
    <button aria-pressed={locale === "zh-CN"} disabled={pending} onClick={() => change("zh-CN")} type="button">{chinese}</button>
  </div>;
}
