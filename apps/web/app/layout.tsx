import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ProductShell } from "@/components/product-shell";
import { productConfig } from "@/config/product.config";
import { getLocale } from "@/modules/platform/i18n/locale";
import "@xwlc/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = { title: { default: productConfig.identity.name, template: `%s · ${productConfig.identity.name}` }, description: productConfig.identity.tagline };
export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return <html lang={locale}><body style={{ "--accent": productConfig.theme.accent, "--accent-soft": productConfig.theme.accentSoft, "--surface": productConfig.theme.surface, "--ink": productConfig.theme.ink } as React.CSSProperties}><ProductShell>{children}</ProductShell></body></html>;
}
