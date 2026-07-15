import { redirect } from "next/navigation";
import { StatePanel } from "@xwlc/ui";
import { productConfig } from "@/config/product.config";
import { getCurrentAccount } from "@/modules/platform/auth/current-account";
import { getLocalizedProduct } from "@/modules/platform/i18n/locale";
import { ProductWorkspace } from "@/modules/product/product-workspace";

export const dynamic = "force-dynamic";

export default async function ProductPage() {
  const account = await getCurrentAccount();
  const { messages, copy } = await getLocalizedProduct();
  if (!account.configured) return <div className="page"><StatePanel kind="disabled" kindLabel={messages.stateDisabled} title={messages.authNotConfigured} description={messages.authNotConfiguredDescription} /></div>;
  if (!account.user) redirect(`${productConfig.paths.login}?next=${encodeURIComponent(productConfig.paths.product)}`);
  return <ProductWorkspace messages={messages} copy={copy} />;
}
