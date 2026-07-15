import Link from "next/link";
import { FormField, Input, Notice, PageHeader, Tabs } from "@xwlc/ui";
import { productConfig } from "@/config/product.config";
import { requestPasswordReset, signIn, signUp } from "@/modules/platform/auth/actions";
import { normalizeInternalReturn } from "@/modules/platform/navigation/internal-return";
import { getCurrentAccount } from "@/modules/platform/auth/current-account";
import { getLocalizedProduct } from "@/modules/platform/i18n/locale";
import { AuthSubmitButton } from "@/modules/platform/auth/auth-submit-button";

type LoginMode = "signin" | "signup" | "reset";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string; error?: string; message?: string }> }) {
  const params = await searchParams;
  const account = await getCurrentAccount();
  const { messages, copy } = await getLocalizedProduct();
  const next = normalizeInternalReturn(params.next, productConfig.paths.product);
  const mode: LoginMode = params.mode === "signup" || params.mode === "reset" ? params.mode : "signin";
  const modeHref = (target: LoginMode) => {
    const search = new URLSearchParams({ mode: target, next });
    return `${productConfig.paths.login}?${search}`;
  };
  const errorMessages: Record<string, string> = {
    invalid_credentials: messages.invalidCredentials,
    invalid_signup: messages.invalidSignup,
    signup_failed: messages.signupFailed,
    confirmation_failed: messages.confirmationFailed,
    reset_failed: messages.resetFailed,
    not_configured: messages.authUnavailable,
    invalid_app_url: messages.authRejected
  };
  const message = params.message === "check_email" ? messages.checkEmail : params.message === "reset_requested" ? messages.resetRequested : null;
  const title = mode === "signup" ? messages.signUpMode : mode === "reset" ? messages.resetMode : copy.login.title;
  const description = mode === "signup" ? messages.signUpDescription : mode === "reset" ? messages.resetDescription : copy.login.description;

  return <div className="page narrow">
    <PageHeader title={title} description={description} />
    <Tabs label={messages.authModeLabel}>
      <Link aria-current={mode === "signin" ? "page" : undefined} href={modeHref("signin")}>{messages.signInMode}</Link>
      <Link aria-current={mode === "signup" ? "page" : undefined} href={modeHref("signup")}>{messages.signUpMode}</Link>
      <Link aria-current={mode === "reset" ? "page" : undefined} href={modeHref("reset")}>{messages.resetMode}</Link>
    </Tabs>
    {!account.configured ? <Notice variant="warning">{messages.authUnavailable}</Notice> : null}
    {params.error && account.configured ? <Notice variant="error">{errorMessages[params.error] ?? messages.authRejected}</Notice> : null}
    {message ? <Notice variant="success">{message}</Notice> : null}
    {mode === "reset" ? <form action={requestPasswordReset} className="card form" aria-disabled={!account.configured}>
      <FormField id="reset-email" label={messages.email}><Input name="email" type="email" autoComplete="email" required disabled={!account.configured} /></FormField>
      <AuthSubmitButton disabled={!account.configured} label={messages.resetPassword} pendingLabel={messages.sendingReset} />
      <Link className="text-link" href={modeHref("signin")}>{messages.backToSignIn}</Link>
    </form> : <form action={mode === "signup" ? signUp : signIn} className="card form" aria-disabled={!account.configured}>
      <input type="hidden" name="next" value={next} />
      <FormField id="email" label={messages.email}><Input name="email" type="email" autoComplete="email" required disabled={!account.configured} /></FormField>
      <FormField id="password" label={messages.password} hint={messages.passwordHint}><Input name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} disabled={!account.configured} /></FormField>
      {mode === "signup" ? <FormField id="confirm-password" label={messages.confirmPassword}><Input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} disabled={!account.configured} /></FormField> : null}
      <AuthSubmitButton disabled={!account.configured} label={mode === "signup" ? messages.createAccount : messages.signIn} pendingLabel={mode === "signup" ? messages.creatingAccount : messages.signingIn} />
      {mode === "signin" ? <Link className="text-link" href={modeHref("reset")}>{messages.forgotPassword}</Link> : null}
    </form>}
  </div>;
}
