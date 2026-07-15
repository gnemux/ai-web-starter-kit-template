import { redirect } from "next/navigation";
import { PageHeader, StatePanel } from "@xwlc/ui";
import { resolveCapabilityRegistry } from "@xwlc/platform";
import { productConfig } from "@/config/product.config";
import { getCurrentAccount } from "@/modules/platform/auth/current-account";
import { createMockAiDraft } from "@/modules/platform/ai/mock";
import { getLocalizedProduct } from "@/modules/platform/i18n/locale";
export const dynamic = "force-dynamic";
export default async function UsagePage() {
  const account = await getCurrentAccount();
  const { messages } = await getLocalizedProduct();
  if (account.configured && !account.user) redirect(`${productConfig.paths.login}?next=${encodeURIComponent(productConfig.paths.usage)}`);
  const capability = resolveCapabilityRegistry(productConfig.capabilities, process.env).find((entry) => entry.id === "ai")!;
  const mock = capability.mode === "mock" && capability.state === "enabled" ? createMockAiDraft("product_onboarding") : null;
  const content = capability.state === "disabled"
    ? { kind: "disabled" as const, kindLabel: messages.stateDisabled, title: messages.aiDisabled, description: messages.aiDisabledDescription }
    : capability.state === "not_configured"
      ? { kind: "error" as const, kindLabel: messages.stateError, title: messages.aiIncomplete, description: `${messages.externalConfigurationRequires} ${capability.requiredEnvironment.join(", ")}.` }
      : capability.state === "not_implemented"
        ? { kind: "disabled" as const, kindLabel: messages.stateDisabled, title: messages.aiNotImplemented, description: messages.aiDisabledDescription }
        : { kind: "empty" as const, kindLabel: messages.stateEmpty, title: messages.aiMockReady, description: mock ? messages.aiMockReadyDescription : messages.aiDisabledDescription };
  return <div className="page"><PageHeader title={messages.usage} description={messages.usageDescription} /><StatePanel {...content} /></div>;
}
