export function buildEmailConfirmationUrl(appUrl: string, next: string) {
  const origin = new URL(appUrl);
  if (!(["http:", "https:"] as string[]).includes(origin.protocol) || origin.username || origin.password) throw new Error("Invalid app origin");
  const callback = new URL("/auth/confirm", origin.origin);
  callback.searchParams.set("next", next);
  return callback.toString();
}
