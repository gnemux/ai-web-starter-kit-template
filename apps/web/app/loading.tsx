import { StatePanel } from "@xwlc/ui";
import { getLocalizedProduct } from "@/modules/platform/i18n/locale";
export default async function Loading() { const { messages } = await getLocalizedProduct(); return <div className="page"><StatePanel kind="loading" kindLabel={messages.stateLoading} title={messages.loading} description={messages.loadingDescription} /></div>; }
