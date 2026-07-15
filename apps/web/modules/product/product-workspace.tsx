import Link from "next/link";
import { Card, Disclosure, NavTabs, PageHeader, SectionHeader, StatePanel } from "@xwlc/ui";
import { resolveCapabilityRegistry } from "@xwlc/platform";
import { productConfig } from "@/config/product.config";
import type { platformMessages } from "@/modules/platform/i18n/messages";

type Messages = (typeof platformMessages)[keyof typeof platformMessages];

export function ProductWorkspace({ messages, copy }: { messages: Messages; copy: (typeof productConfig.localized)[keyof typeof productConfig.localized] }) {
  const capabilities = resolveCapabilityRegistry(productConfig.capabilities, process.env);
  const capabilityLabels = { analytics: messages.capabilityAnalytics, payment: messages.capabilityPayment, ai: messages.capabilityAi } as const;
  const modeLabels = { disabled: messages.modeDisabled, sandbox: messages.modeSandbox, mock: messages.modeMock, external: messages.modeExternal } as const;
  const stateLabels = { enabled: messages.stateEnabled, disabled: messages.stateDisabledCapability, not_configured: messages.stateNotConfigured, not_implemented: messages.stateNotImplemented, error: messages.stateCapabilityError } as const;
  return <div className="page">
    <PageHeader eyebrow={messages.productBoundary} title={copy.navigation[0]?.label ?? productConfig.identity.name} description={messages.productDescription} />
    <NavTabs label={messages.primaryNavigation}><Link aria-current="page" href={productConfig.paths.product}>{messages.workspaceOverview}</Link><Link href={productConfig.paths.account}>{messages.workspaceAccount}</Link></NavTabs>
    <SectionHeader title={messages.workspaceTitle} description={messages.workspaceDescription} />
    <div className="workspace-grid">
      <StatePanel kind="empty" kindLabel={messages.stateEmpty} title={messages.readyTitle} description={messages.readyDescription} />
      <Card variant="outlined"><h2>{messages.capabilityRegistry}</h2><ul>{capabilities.map((entry) => <li key={entry.id}><strong>{capabilityLabels[entry.id]}</strong>: {modeLabels[entry.mode]} · {stateLabels[entry.state]}</li>)}</ul><Disclosure summary={messages.capabilityHelp}><p>{messages.capabilityHelpText}</p></Disclosure></Card>
    </div>
  </div>;
}
