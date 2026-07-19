export function buildEmailConfirmationUrl(appUrl: string, next: string) {
  const origin = new URL(appUrl);
  if (!(["http:", "https:"] as string[]).includes(origin.protocol) || origin.username || origin.password) throw new Error("Invalid app origin");
  const callback = new URL("/auth/confirm", origin.origin);
  callback.searchParams.set("next", next);
  return callback.toString();
}

export function buildPasswordRecoveryUrl(appUrl: string, next: string) {
  const origin = new URL(appUrl);
  if (!(["http:", "https:"] as string[]).includes(origin.protocol) || origin.username || origin.password) throw new Error("Invalid app origin");
  const callback = new URL("/auth/recovery", origin.origin);
  callback.searchParams.set("next", next);
  return callback.toString();
}

export function getAuthAppUrl() {
  const value = (process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")).replace(/\/$/, "");
  const url = new URL(value);
  if (!(["http:", "https:"] as string[]).includes(url.protocol) || url.username || url.password) throw new Error("Invalid app origin");
  const hosted = process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_APP_ENV === "preview" || process.env.NEXT_PUBLIC_APP_ENV === "production";
  if (hosted && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) throw new Error("Hosted Auth requires a public app origin");
  return url.origin;
}
