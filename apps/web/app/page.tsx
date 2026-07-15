import Link from "next/link";
import { Badge, Card, PageHeader } from "@xwlc/ui";
import { productConfig } from "@/config/product.config";
import { getCurrentAccount } from "@/modules/platform/auth/current-account";
import { getLocalizedProduct } from "@/modules/platform/i18n/locale";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const account = await getCurrentAccount();
  const { messages, copy } = await getLocalizedProduct();
  const primaryHref = account.user ? productConfig.home.primaryHref : productConfig.paths.login;
  const primaryLabel = account.user ? copy.home.primaryAction : messages.signIn;
  return <div className="page hero"><div><Badge>{copy.home.eyebrow}</Badge><PageHeader title={copy.home.title} description={copy.home.description} /><div className="actions"><Link className="button" href={primaryHref}>{primaryLabel}</Link><Link className="button secondary" href={productConfig.home.secondaryHref}>{copy.home.secondaryAction}</Link></div></div><Card><p className="eyebrow">{messages.foundationState}</p><h2>{account.configured ? messages.authenticationReady : messages.safeLocalMode}</h2><p>{account.configured ? messages.authenticationReadyDescription : messages.safeLocalModeDescription}</p></Card></div>;
}
