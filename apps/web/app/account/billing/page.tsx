import { redirect } from "next/navigation";
import { PageHeader, StatePanel } from "@xwlc/ui";
import { resolveCapabilityRegistry } from "@xwlc/platform";
import { productConfig } from "@/config/product.config";
import { getCurrentAccount } from "@/modules/platform/auth/current-account";
import { createSandboxCheckoutIntent } from "@/modules/platform/payment/sandbox";
import { getLocalizedProduct } from "@/modules/platform/i18n/locale";
export const dynamic = "force-dynamic";
export default async function BillingPage() {
  const account = await getCurrentAccount();
  const { messages } = await getLocalizedProduct();
  if (account.configured && !account.user) redirect(`${productConfig.paths.login}?next=${encodeURIComponent(productConfig.paths.billing)}`);
  const capability = resolveCapabilityRegistry(productConfig.capabilities, process.env).find((entry) => entry.id === "payment")!;
  const sandbox = capability.mode === "sandbox" && capability.state === "enabled" ? createSandboxCheckoutIntent({ idempotencyKey: "preview:checkout", currency: "usd", amountCents: 0 }) : null;
  const content = capability.state === "disabled"
    ? { kind: "disabled" as const, kindLabel: messages.stateDisabled, title: messages.paymentDisabled, description: messages.paymentDisabledDescription }
    : capability.state === "not_configured"
      ? { kind: "error" as const, kindLabel: messages.stateError, title: messages.paymentIncomplete, description: `${messages.externalConfigurationRequires} ${capability.requiredEnvironment.join(", ")}.` }
      : capability.state === "not_implemented"
        ? { kind: "disabled" as const, kindLabel: messages.stateDisabled, title: messages.paymentNotImplemented, description: messages.paymentDisabledDescription }
        : { kind: "empty" as const, kindLabel: messages.stateEmpty, title: messages.paymentSandboxReady, description: sandbox ? messages.paymentSandboxReadyDescription : messages.paymentDisabledDescription };
  return <div className="page"><PageHeader title={messages.billing} description={messages.billingDescription} /><StatePanel {...content} /></div>;
}
