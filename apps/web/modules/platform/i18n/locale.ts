import "server-only";
import { cookies } from "next/headers";
import { productConfig } from "@/config/product.config";
import { isAppLocale, platformMessages, type AppLocale } from "./messages";

export const localeCookie = "xwlc_locale";

export async function getLocale(): Promise<AppLocale> {
  const stored = (await cookies()).get(localeCookie)?.value;
  if (isAppLocale(stored)) return stored;
  return isAppLocale(productConfig.identity.locale) ? productConfig.identity.locale : "en-US";
}

export async function getLocalizedProduct() {
  const locale = await getLocale();
  return { locale, messages: platformMessages[locale], copy: productConfig.localized[locale] };
}
