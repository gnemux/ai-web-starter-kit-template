import { Card, PageHeader } from "@xwlc/ui";
import { productConfig } from "@/config/product.config";
import { getLocalizedProduct } from "@/modules/platform/i18n/locale";
import { normalizeInternalReturn } from "@/modules/platform/navigation/internal-return";
import { RecoveryConfirmation } from "./recovery-confirmation";

export const dynamic = "force-dynamic";

export default async function RecoveryPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { messages } = await getLocalizedProduct();
  const next = normalizeInternalReturn((await searchParams).next, productConfig.paths.product);
  return <div className="page narrow sensitive-auth-page">
    <PageHeader title={messages.recoveryTitle} description={messages.recoveryDescription} />
    <Card><RecoveryConfirmation next={next} labels={{ continue: messages.continueRecovery, invalid: messages.invalidRecovery, ready: messages.recoveryReady, requestNew: messages.requestNewRecovery, verifying: messages.verifyingRecovery }} /></Card>
  </div>;
}
