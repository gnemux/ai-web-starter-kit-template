const eventNamePattern = /^[a-z][a-z0-9_]{0,47}$/;
const slugValuePattern = /^[a-z0-9][a-z0-9_.:-]{0,47}$/;
const stringKeys = new Set(["surface", "action", "status", "variant", "feature", "step"]);
const numberKeys = new Set(["count", "duration_ms"]);
const booleanKeys = new Set(["enabled"]);
const sensitiveKeyPattern = /(?:prompt|result|email|phone|name|token|secret|password|cookie|auth|content|message|payload|url)/i;
const appEnvironments = new Set(["local", "test", "preview", "staging", "production"]);
const semanticVersionPattern = /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/;

export const analyticsPrivacyOptions = {
  autocapture: false,
  capture_pageview: false,
  capture_pageleave: false,
  disable_session_recording: true,
  persistence: "memory"
} as const;

export function buildAnalyticsBaseProperties(input: { productId: string; appEnvironment: string | undefined; templateVersion: string; releaseVersion: string | undefined; defaultReleaseVersion: string }) {
  if (!slugValuePattern.test(input.productId)) throw new TypeError("Analytics product id is invalid");
  if (!semanticVersionPattern.test(input.templateVersion)) throw new TypeError("Analytics template version is invalid");
  const fallbackRelease = semanticVersionPattern.test(input.defaultReleaseVersion) ? input.defaultReleaseVersion : "0.0.0";
  const releaseVersion = input.releaseVersion && semanticVersionPattern.test(input.releaseVersion) ? input.releaseVersion : fallbackRelease;
  return {
    product_id: input.productId,
    app_environment: input.appEnvironment && appEnvironments.has(input.appEnvironment) ? input.appEnvironment : "local",
    template_version: input.templateVersion,
    release_version: releaseVersion,
    module: "product"
  } as const;
}

export function isSafePosthogPublicKey(value: string | undefined): value is string {
  return typeof value === "string" && /^phc_[A-Za-z0-9_-]{8,128}$/.test(value);
}

export function assertProductEventName(name: string) {
  if (!eventNamePattern.test(name)) throw new TypeError("Analytics event name must be a bounded snake_case identifier");
  return name;
}

export function sanitizeAnalyticsProperties(properties: Record<string, unknown>) {
  const sanitized: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (sensitiveKeyPattern.test(key)) throw new TypeError(`Sensitive analytics property is forbidden: ${key}`);
    if (stringKeys.has(key)) {
      if (typeof value !== "string" || !slugValuePattern.test(value)) throw new TypeError(`Invalid analytics slug property: ${key}`);
      sanitized[key] = value;
      continue;
    }
    if (numberKeys.has(key)) {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1_000_000_000) throw new TypeError(`Invalid analytics number property: ${key}`);
      sanitized[key] = value;
      continue;
    }
    if (booleanKeys.has(key)) {
      if (typeof value !== "boolean") throw new TypeError(`Invalid analytics boolean property: ${key}`);
      sanitized[key] = value;
      continue;
    }
    throw new TypeError(`Unknown analytics property: ${key}`);
  }
  return sanitized;
}
