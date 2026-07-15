import { redirect } from "next/navigation";
import { Button, Card, FormField, Input, Notice, PageHeader, StatePanel } from "@xwlc/ui";
import { productConfig } from "@/config/product.config";
import { getCurrentAccount } from "@/modules/platform/auth/current-account";
import { updatePassword } from "@/modules/platform/auth/actions";
import { getLocalizedProduct } from "@/modules/platform/i18n/locale";
import { ProfileForm } from "./profile-form";
import { AccountSignOut } from "./account-sign-out";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ mode?: string; error?: string; message?: string }> }) {
  const params = await searchParams;
  const account = await getCurrentAccount();
  const { messages, copy } = await getLocalizedProduct();
  if (!account.configured) return <div className="page"><PageHeader title={copy.account.title} description={copy.account.description} /><StatePanel kind="disabled" kindLabel={messages.stateDisabled} title={messages.authNotConfigured} description={messages.authNotConfiguredDescription} /></div>;
  if (!account.user) redirect(`${productConfig.paths.login}?next=${encodeURIComponent(productConfig.paths.account)}`);

  if (params.mode === "update-password") return <div className="page narrow">
    <PageHeader title={messages.updatePassword} description={messages.updatePasswordDescription} />
    {params.error ? <Notice variant="error">{params.error === "password_invalid" ? messages.invalidSignup : messages.passwordUpdateFailed}</Notice> : null}
    <Card><form action={updatePassword} className="form">
      <FormField id="new-password" label={messages.password} hint={messages.passwordHint}><Input name="password" type="password" autoComplete="new-password" required minLength={8} /></FormField>
      <FormField id="confirm-new-password" label={messages.confirmPassword}><Input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} /></FormField>
      <Button type="submit">{messages.updatePassword}</Button>
    </form></Card>
  </div>;

  return <div className="page narrow">
    <PageHeader title={copy.account.title} description={copy.account.description} />
    {params.message === "password_updated" ? <Notice variant="success">{messages.passwordUpdated}</Notice> : null}
    <Card><p className="eyebrow">{messages.signedIn}</p><h2>{account.user.email ?? copy.account.title}</h2>
      <ProfileForm initialName={account.profile?.display_name ?? ""} labels={{ displayName: messages.displayName, displayNameHint: messages.displayNameHint, save: messages.saveProfile, saving: messages.saving, success: messages.profileSaved, error: messages.profileFailed, dismiss: messages.dismissNotification }} />
      <div className="form"><AccountSignOut labels={{ cancel: messages.cancel, closeDialog: messages.closeDialog, confirm: messages.confirmSignOut, description: messages.confirmSignOutDescription, signOut: messages.signOut, title: messages.confirmSignOutTitle }} /></div>
    </Card>
  </div>;
}
