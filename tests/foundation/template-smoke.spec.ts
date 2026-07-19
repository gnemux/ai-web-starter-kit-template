import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const configuredProduct = JSON.parse(readFileSync("product.config.json", "utf8"));
const productPath = configuredProduct.paths.product as string;
const productPathPattern = new RegExp(`${productPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
const encodedProductPath = encodeURIComponent(productPath);

test("anonymous product entry preserves its safe return path", async ({ page }) => {
  await page.goto(productPath);
  await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodedProductPath}$`));
  await expect(page.getByRole("heading", { name: configuredProduct.login.title })).toBeVisible();
});

test("recovery and optional social login fail safely without provider configuration", async ({ page }) => {
  await page.goto(`/login?next=${encodedProductPath}`);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Continue with Apple" })).toBeDisabled();
  await page.goto(`/auth/recovery?next=${encodedProductPath}#token_hash=invalid&type=recovery`);
  await expect(page.getByText("This reset link is invalid, expired or already used.")).toBeVisible();
  await expect(page).toHaveURL(`/auth/recovery?next=${encodedProductPath}`);
});

test("an invalid persisted local session recovers as anonymous", async ({ context, page }) => {
  const staleSession = {
    access_token: "expired.local.session",
    refresh_token: "missing-local-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 1,
    user: { id: "00000000-0000-4000-8000-000000000000", aud: "authenticated", role: "authenticated", email: "stale@example.test" }
  };
  await context.addCookies([{
    name: "sb-127-auth-token",
    value: "base64-" + Buffer.from(JSON.stringify(staleSession)).toString("base64url"),
    domain: "127.0.0.1",
    path: "/"
  }]);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: configuredProduct.home.title })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  expect((await context.cookies()).some(({ name }) => name.startsWith("sb-127-auth-token"))).toBe(false);
});

test("foundation account, locale, capability states and shared interactions remain usable", async ({ page }) => {
  const email = "foundation-smoke-" + Date.now() + "-" + test.info().project.name + "@example.test";
  const password = "Template-Smoke-2026!";
  await page.goto(`/login?mode=signup&next=${encodedProductPath}`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirm-password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(productPathPattern);
  await expect(page.getByRole("heading", { name: "Ready for a real customer journey" })).toBeVisible();

  await page.getByRole("button", { name: "中文" }).first().click();
  await expect(page.getByRole("heading", { name: "可以开始真实产品旅程" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "可以开始真实产品旅程" })).toBeVisible();
  await page.getByRole("button", { name: "English" }).first().click();

  await page.goto("/account/billing");
  await expect(page.getByRole("heading", { name: "Payment disabled" })).toBeVisible();
  await page.goto("/account/usage");
  await expect(page.getByRole("heading", { name: "AI disabled" })).toBeVisible();

  await page.goto("/account");
  await page.getByLabel(/Display name/).fill("Foundation account");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel(/Display name/)).toHaveValue("Foundation account");

  const signOut = page.getByRole("button", { name: "Sign out", exact: true });
  await signOut.click();
  await expect(page.getByRole("dialog", { name: "Sign out?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(signOut).toBeFocused();
  await signOut.click();
  await page.getByRole("button", { name: "Sign out now" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto(`/login?next=${encodedProductPath}`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(productPathPattern);

  await page.goto("/missing-foundation-route");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
