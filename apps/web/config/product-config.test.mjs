import assert from "node:assert/strict";
import test from "node:test";
import { productConfig, templateMetadata } from "./product.config.ts";
import { analyticsPrivacyOptions, assertProductEventName, buildAnalyticsBaseProperties, isSafePosthogPublicKey, sanitizeAnalyticsProperties } from "../modules/platform/analytics/properties.ts";
import { assertCapabilityConfiguration, resolveCapabilityRegistry } from "@xwlc/platform";

test("generated product config has a stable identity and bounded provider modes", () => {
  assert.match(productConfig.identity.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.match(productConfig.identity.eventNamespace, /^[a-z][a-z0-9_]*$/);
  assert.ok(["disabled", "external"].includes(productConfig.capabilities.analytics));
  assert.ok(["disabled", "sandbox", "external"].includes(productConfig.capabilities.payment));
  assert.ok(["disabled", "mock", "external"].includes(productConfig.capabilities.ai));
  assert.deepEqual(productConfig.paths, { home: "/", login: "/login", account: "/account", product: "/product", billing: "/account/billing", usage: "/account/usage" });
  const generatedRoutes = new Set(Object.values(productConfig.paths));
  for (const link of [...productConfig.navigation, ...productConfig.footerLinks]) assert.ok(generatedRoutes.has(link.href));
  assert.ok(generatedRoutes.has(productConfig.home.primaryHref));
  assert.ok(generatedRoutes.has(productConfig.home.secondaryHref));
  assert.doesNotThrow(() => assertCapabilityConfiguration(productConfig.capabilities, {}));
});

test("capability registry distinguishes disabled, safe adapters and incomplete external providers", () => {
  const modes = { analytics: "external", payment: "sandbox", ai: "mock" };
  const registry = resolveCapabilityRegistry(modes, {});
  assert.equal(registry.find((item) => item.id === "analytics").state, "not_configured");
  assert.equal(registry.find((item) => item.id === "payment").reason, "safe_adapter");
  assert.equal(registry.find((item) => item.id === "ai").reason, "safe_adapter");
  assert.throws(() => assertCapabilityConfiguration(modes, {}), /NEXT_PUBLIC_POSTHOG_KEY/);
  assert.doesNotThrow(() => assertCapabilityConfiguration(modes, { NEXT_PUBLIC_POSTHOG_KEY: "phc_publictest123" }));
  const external = resolveCapabilityRegistry({ analytics: "disabled", payment: "external", ai: "external" }, { PAYMENT_PROVIDER_SECRET: "secret", AI_PROVIDER_KEY: "secret" });
  assert.ok(external.filter((item) => item.id !== "analytics").every((item) => item.state === "not_implemented" && item.reason === "adapter_missing"));
  assert.throws(() => assertCapabilityConfiguration({ analytics: "disabled", payment: "external", ai: "external" }, {}), /unavailable or missing configuration/);
});

test("analytics accepts only bounded neutral event properties", () => {
  assert.equal(assertProductEventName("product_opened"), "product_opened");
  assert.deepEqual(sanitizeAnalyticsProperties({ surface: "product", status: "success", count: 2, enabled: true }), {
    surface: "product",
    status: "success",
    count: 2,
    enabled: true,
  });
  assert.throws(() => assertProductEventName("Product Opened"), /bounded snake_case/);
  for (const properties of [
    { prompt: "private input" },
    { result: "private output" },
    { email: "person@example.test" },
    { token: "private-token" },
    { unknown: "value" },
    { surface: "free form private text" },
    { count: Number.POSITIVE_INFINITY },
  ]) assert.throws(() => sanitizeAnalyticsProperties(properties), /analytics/i);
});

test("analytics injects non-overridable multi-product and environment dimensions", () => {
  const base = buildAnalyticsBaseProperties({ productId: productConfig.identity.id, appEnvironment: undefined, templateVersion: templateMetadata.templateVersion, releaseVersion: undefined, defaultReleaseVersion: productConfig.identity.releaseVersion });
  assert.deepEqual(Object.keys(base).sort(), ["app_environment", "module", "product_id", "release_version", "template_version"]);
  for (const reserved of ["product_id", "app_environment", "template_version", "release_version"]) {
    assert.throws(() => sanitizeAnalyticsProperties({ [reserved]: "forged" }), /analytics/i);
  }
  assert.equal(buildAnalyticsBaseProperties({ productId: productConfig.identity.id, appEnvironment: "<script>", templateVersion: templateMetadata.templateVersion, releaseVersion: "bad value", defaultReleaseVersion: productConfig.identity.releaseVersion }).app_environment, "local");
  assert.equal(isSafePosthogPublicKey("placeholder"), false);
  assert.equal(isSafePosthogPublicKey("phc_publictest123"), true);
});

test("analytics disables every automatic capture path", () => {
  assert.deepEqual(analyticsPrivacyOptions, {
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    persistence: "memory",
  });
});
