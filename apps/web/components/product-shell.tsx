import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@xwlc/ui";
import { productConfig } from "@/config/product.config";
import { LanguageSwitcher } from "./language-switcher";
import { getLocalizedProduct } from "@/modules/platform/i18n/locale";

export async function ProductShell({ children }: { children: ReactNode }) {
  const { locale, messages, copy } = await getLocalizedProduct();
  return <div className="shell"><header className="site-header"><Link href={productConfig.paths.home} aria-label={`${productConfig.identity.name} ${messages.homeLinkLabel}`}><BrandMark mark={productConfig.identity.mark} name={productConfig.identity.name} /></Link><div className="header-actions"><nav aria-label={messages.primaryNavigation}>{productConfig.navigation.map((item, index) => <Link key={item.href} href={item.href}>{copy.navigation[index].label}</Link>)}</nav><LanguageSwitcher locale={locale} label={messages.language} english={messages.english} chinese={messages.chinese} /></div></header><main>{children}</main><footer><p>{copy.tagline}</p><div className="footer-actions"><nav aria-label={messages.footerNavigation}>{productConfig.footerLinks.map((item, index) => <Link key={item.href} href={item.href}>{copy.footerLinks[index].label}</Link>)}</nav><LanguageSwitcher locale={locale} label={messages.language} english={messages.english} chinese={messages.chinese} /></div></footer></div>;
}
