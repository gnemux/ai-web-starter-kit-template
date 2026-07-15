import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (name) => readFile(new URL(name, import.meta.url), "utf8");

test("shared UI owns semantic tokens and reusable component styles", async () => {
  const css = await source("./styles.css");
  for (const token of ["--ui-color-success", "--ui-color-warning", "--ui-color-error", "--ui-space-4", "--ui-radius-lg", "--ui-control-height", "--ui-layer-dialog", "--ui-focus-color"]) assert.match(css, new RegExp(token));
  for (const contract of [".button", ".field-error", ".notice-success", ".dialog-close", ".toast"]) assert.ok(css.includes(contract));
});

test("dialog and toast require localized dismissal contracts", async () => {
  const dialog = await source("./dialog.tsx");
  assert.match(dialog, /closeLabel: string/);
  assert.doesNotMatch(dialog, /Close dialog/);
  const toast = await source("./toast.tsx");
  assert.match(toast, /setTimeout/);
  assert.match(toast, /dismissLabel: string/);
  assert.match(toast, /onMouseEnter/);
  assert.match(toast, /onFocus/);
  assert.doesNotMatch(toast, /Dismiss notification/);
});

test("button variants, form descriptions and semantic disclosure are owned by the shared package", async () => {
  const ui = await source("./index.tsx");
  for (const contract of ["ButtonVariant", "ButtonSize", "loadingLabel", "button-spinner", "aria-describedby"]) assert.ok(ui.includes(contract));
  for (const contract of ["ui-input", "NavTabs", "Disclosure", "ChevronDownIcon"]) assert.ok(ui.includes(contract));
  for (const obsolete of ["export const Tabs", "function Popover", "export const Panel", "ProgressBar", "Textarea", "Checkbox", "ui-container"]) assert.ok(!ui.includes(obsolete));
  for (const forbidden of ["Loading content", "Content is loading.", 'label = "Progress"']) assert.doesNotMatch(ui, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const css = await source("./styles.css");
  assert.doesNotMatch(css, /(?:^|\n)input, textarea, select/);
  assert.doesNotMatch(css, /(?:^|\n)dialog \{/);
});

test("the neutral icon set is bounded and accessible by contract", async () => {
  const icons = await source("./icons.tsx");
  for (const name of ["CloseIcon", "ChevronDownIcon", "CheckIcon", "InfoIcon", "WarningIcon"]) assert.match(icons, new RegExp(`function ${name}`));
  for (const contract of ["aria-hidden", "<title>", 'focusable="false"', 'stroke: "currentColor"']) assert.ok(icons.includes(contract));
});
