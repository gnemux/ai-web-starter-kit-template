import { redirect } from "next/navigation";
import { Card, PageHeader } from "@xwlc/ui";
import { productConfig } from "@/config/product.config";
import { getCurrentAccount } from "@/modules/platform/auth/current-account";
import { getLocalizedProduct } from "@/modules/platform/i18n/locale";
import { normalizeInternalReturn } from "@/modules/platform/navigation/internal-return";
import { RecoveredPasswordForm } from "./recovered-password-form";

export const dynamic = "force-dynamic";

export default async function RecoveryPasswordPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { messages } = await getLocalizedProduct();
  const next = normalizeInternalReturn((await searchParams).next, productConfig.paths.product);
  const account = await getCurrentAccount();
  if (!account.configured || !account.user) redirect(`/login?mode=reset&next=${encodeURIComponent(next)}`);
  return <div className="page narrow sensitive-auth-page">
    <PageHeader title={messages.recoveryPasswordTitle} description={messages.recoveryPasswordDescription} />
    <Card><RecoveredPasswordForm next={next} labels={{ confirm: messages.confirmPassword, failed: messages.passwordUpdateFailed, hint: messages.passwordHint, mismatch: messages.passwordMismatch, password: messages.password, returnToProduct: messages.returnToProduct, save: messages.updatePassword, saving: messages.savingPassword, success: messages.passwordUpdated, tooShort: messages.passwordTooShort }} /></Card>
  </div>;
}
