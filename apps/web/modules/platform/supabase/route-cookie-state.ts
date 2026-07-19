import type { CookieOptions } from "@supabase/ssr";

type CookieMutation = { name: string; options: CookieOptions; value: string };
type CookieResponse = { cookies: { set(name: string, value: string, options: CookieOptions): unknown }; headers: Headers };

export function createSupabaseRouteCookieState(initialCookies: ReadonlyArray<{ name: string; value: string }>) {
  const current = new Map(initialCookies.map(({ name, value }) => [name, value]));
  const pendingCookies = new Map<string, CookieMutation>();
  const pendingHeaders = new Map<string, string>();
  return {
    getAll: () => Array.from(current, ([name, value]) => ({ name, value })),
    setAll(cookies: CookieMutation[], headers: Record<string, string>) {
      for (const cookie of cookies) {
        const scope = [cookie.options.domain ?? "", cookie.options.path ?? "", cookie.name].join("|");
        pendingCookies.set(scope, cookie);
        if (cookie.options.maxAge === 0) current.delete(cookie.name); else current.set(cookie.name, cookie.value);
      }
      for (const entry of Object.entries(headers)) pendingHeaders.set(...entry);
    },
    applyToResponse<T extends CookieResponse>(response: T) {
      for (const { name, value, options } of pendingCookies.values()) response.cookies.set(name, value, options);
      for (const [name, value] of pendingHeaders) response.headers.set(name, value);
      response.headers.set("Cache-Control", "private, no-store, max-age=0");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
      return response;
    }
  };
}
