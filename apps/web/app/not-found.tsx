import Link from "next/link";
import { StatePanel } from "@xwlc/ui";
import { getLocalizedProduct } from "@/modules/platform/i18n/locale";
export default async function NotFound() { const { messages } = await getLocalizedProduct(); return <div className="page"><StatePanel kind="error" kindLabel={messages.stateError} title={messages.pageNotFound} description={messages.pageNotFoundDescription} /><Link className="button" href="/">{messages.returnHome}</Link></div>; }
