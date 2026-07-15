import { expect, test } from "@playwright/test";

test("anonymous product entry preserves its safe return path", async ({ page }) => {
  await page.goto("/product");
  await expect(page).toHaveURL(/\/login\?next=%2Fproduct$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
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
    value: `base64-${Buffer.from(JSON.stringify(staleSession)).toString("base64url")}`,
    domain: "127.0.0.1",
    path: "/"
  }]);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Start with the platform work already solved." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  expect((await context.cookies()).some(({ name }) => name.startsWith("sb-127-auth-token"))).toBe(false);
});

test("local account, profile, locale and shared UI remain usable", async ({ page }) => {
  const email = `template-smoke-${Date.now()}-${test.info().project.name}@example.test`;
  const password = "Template-Smoke-2026!";
  await page.goto("/login?mode=signup&next=%2Fproduct");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirm-password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/product$/);

  await page.getByRole("button", { name: "中文" }).first().click();
  await expect(page.getByRole("textbox", { name: "流程预览" })).toHaveValue("描述第一个完整的客户旅程。");
  await page.getByRole("button", { name: "English" }).first().click();
  await expect(page.getByRole("textbox", { name: "Workflow preview" })).toHaveValue("Describe the first complete customer journey.");
  await page.getByRole("button", { name: "Review interaction" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByText("Interaction completed locally; no business data was written.")).toBeVisible();

  await page.goto("/account");
  await page.getByLabel(/Display name/).fill("Template smoke account");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel(/Display name/)).toHaveValue("Template smoke account");
});
