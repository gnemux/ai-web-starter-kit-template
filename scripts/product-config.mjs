import { createHash } from "node:crypto";

const internalPathPattern = /^\/(?!\/)[^\s\\]*$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const namespacePattern = /^[a-z][a-z0-9_]*$/;
const hexPattern = /^#[0-9a-fA-F]{6}$/;
const fixedPaths = {
  home: "/",
  login: "/login",
  account: "/account",
  product: "/product",
  billing: "/account/billing",
  usage: "/account/usage"
};
const supportedRoutes = new Set(Object.values(fixedPaths));

function assertKeys(value, allowed, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) throw new TypeError(`${label} contains unknown fields: ${unknown.join(", ")}`);
}

function assertText(value, label, max = 220) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) throw new TypeError(`${label} must be non-empty and at most ${max} characters`);
}

function assertPath(value, label) {
  if (typeof value !== "string" || !internalPathPattern.test(value)) throw new TypeError(`${label} must be a safe internal path`);
}

function assertLinks(value, label) {
  if (!Array.isArray(value) || value.length > 8) throw new TypeError(`${label} must contain at most 8 links`);
  for (const [index, link] of value.entries()) {
    assertKeys(link, ["label", "href"], `${label}[${index}]`);
    assertText(link.label, `${label}[${index}].label`, 48);
    assertPath(link.href, `${label}[${index}].href`);
    if (!supportedRoutes.has(link.href)) throw new TypeError(`${label}[${index}].href must reference a generated route`);
  }
}

export function validateProductConfig(config) {
  assertKeys(config, ["identity", "paths", "home", "login", "account", "capabilities", "navigation", "footerLinks", "localized", "theme"], "product config");
  assertKeys(config.identity, ["id", "name", "mark", "tagline", "locale", "eventNamespace", "releaseVersion"], "identity");
  if (!slugPattern.test(config.identity.id) || config.identity.id.length > 48) throw new TypeError("identity.id must be a bounded kebab-case slug");
  assertText(config.identity.name, "identity.name", 64);
  assertText(config.identity.mark, "identity.mark", 4);
  assertText(config.identity.tagline, "identity.tagline", 160);
  if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(config.identity.locale)) throw new TypeError("identity.locale is invalid");
  if (!namespacePattern.test(config.identity.eventNamespace) || config.identity.eventNamespace.length > 48) throw new TypeError("identity.eventNamespace is invalid");
  if (!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(config.identity.releaseVersion)) throw new TypeError("identity.releaseVersion must be a semantic version");

  const pathKeys = ["home", "login", "account", "product", "billing", "usage"];
  assertKeys(config.paths, pathKeys, "paths");
  for (const key of pathKeys) {
    assertPath(config.paths[key], `paths.${key}`);
    if (config.paths[key] !== fixedPaths[key]) throw new TypeError(`paths.${key} is structural and must remain ${fixedPaths[key]}`);
  }

  assertKeys(config.home, ["eyebrow", "title", "description", "primaryAction", "primaryHref", "secondaryAction", "secondaryHref"], "home");
  for (const key of ["eyebrow", "title", "description", "primaryAction", "secondaryAction"]) assertText(config.home[key], `home.${key}`);
  assertPath(config.home.primaryHref, "home.primaryHref");
  assertPath(config.home.secondaryHref, "home.secondaryHref");
  if (!supportedRoutes.has(config.home.primaryHref) || !supportedRoutes.has(config.home.secondaryHref)) throw new TypeError("home actions must reference generated routes");
  for (const block of ["login", "account"]) {
    assertKeys(config[block], ["title", "description"], block);
    assertText(config[block].title, `${block}.title`, 120);
    assertText(config[block].description, `${block}.description`);
  }

  assertKeys(config.capabilities, ["analytics", "payment", "ai"], "capabilities");
  const allowed = { analytics: ["disabled", "external"], payment: ["disabled", "sandbox", "external"], ai: ["disabled", "mock", "external"] };
  for (const [key, modes] of Object.entries(allowed)) if (!modes.includes(config.capabilities[key])) throw new TypeError(`capabilities.${key} must be one of ${modes.join(" | ")}`);
  assertLinks(config.navigation, "navigation");
  assertLinks(config.footerLinks, "footerLinks");
  assertKeys(config.localized, ["en-US", "zh-CN"], "localized");
  for (const locale of ["en-US", "zh-CN"]) {
    const copy = config.localized[locale];
    assertKeys(copy, ["tagline", "home", "login", "account", "navigation", "footerLinks"], `localized.${locale}`);
    assertText(copy.tagline, `localized.${locale}.tagline`, 160);
    assertKeys(copy.home, ["eyebrow", "title", "description", "primaryAction", "secondaryAction"], `localized.${locale}.home`);
    for (const key of ["eyebrow", "title", "description", "primaryAction", "secondaryAction"]) assertText(copy.home[key], `localized.${locale}.home.${key}`);
    for (const block of ["login", "account"]) {
      assertKeys(copy[block], ["title", "description"], `localized.${locale}.${block}`);
      assertText(copy[block].title, `localized.${locale}.${block}.title`, 120);
      assertText(copy[block].description, `localized.${locale}.${block}.description`);
    }
    assertLinks(copy.navigation.map((item, index) => ({ label: item.label, href: config.navigation[index]?.href })), `localized.${locale}.navigation`);
    assertLinks(copy.footerLinks.map((item, index) => ({ label: item.label, href: config.footerLinks[index]?.href })), `localized.${locale}.footerLinks`);
    if (copy.navigation.length !== config.navigation.length || copy.footerLinks.length !== config.footerLinks.length) throw new TypeError(`localized.${locale} link labels must match the configured link counts`);
  }
  if (!Object.hasOwn(config.localized, config.identity.locale)) throw new TypeError("identity.locale must have localized copy");
  assertKeys(config.theme, ["accent", "accentSoft", "surface", "ink"], "theme");
  for (const [key, value] of Object.entries(config.theme)) if (!hexPattern.test(value)) throw new TypeError(`theme.${key} must be a six-digit hex color`);
  return config;
}

export function configHash(config) {
  return createHash("sha256").update(JSON.stringify(validateProductConfig(config))).digest("hex");
}

export function generatedProductModule(config, templateVersion) {
  validateProductConfig(config);
  return `// Generated by product:init. Edit product.config.json, not this file.\nexport const productConfig = ${JSON.stringify(config, null, 2)} as const;\nexport const templateMetadata = ${JSON.stringify({ templateVersion }, null, 2)} as const;\n`;
}

export function generatedSupabaseConfig(config) {
  validateProductConfig(config);
  const project = config.identity.id.replace(/-/g, "_");
  return `project_id = "${project}"\n\n[api]\nenabled = true\nport = 55321\nschemas = ["public", "graphql_public"]\nextra_search_path = ["public", "extensions"]\nmax_rows = 1000\n\n[db]\nport = 55322\nshadow_port = 55320\nmajor_version = 17\n\n[studio]\nenabled = true\nport = 55323\napi_url = "http://127.0.0.1"\n\n[inbucket]\nenabled = true\nport = 55324\n\n[auth]\nenabled = true\nsite_url = "http://localhost:3000"\nadditional_redirect_urls = ["http://localhost:3000/auth/confirm**", "http://127.0.0.1:3000/auth/confirm**"]\njwt_expiry = 3600\nenable_signup = true\n\n[realtime]\nenabled = false\n\n[storage]\nenabled = false\n\n[edge_runtime]\nenabled = false\n\n[analytics]\nenabled = false\n`;
}

export function productState(config, candidateVersion, status = "pristine") {
  return {
    schemaVersion: 1,
    status,
    baseCandidateVersion: candidateVersion,
    configHash: configHash(config),
    identity: { id: config.identity.id, name: config.identity.name, eventNamespace: config.identity.eventNamespace, releaseVersion: config.identity.releaseVersion }
  };
}
