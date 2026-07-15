export type CapabilityMode = "disabled" | "sandbox" | "mock" | "external";
export type CapabilityState = "enabled" | "disabled" | "not_configured" | "not_implemented" | "error";
export type CapabilityReason = "disabled" | "safe_adapter" | "configured" | "missing_environment" | "adapter_missing";

export type CapabilityAvailability = Readonly<{
  mode: CapabilityMode;
  state: CapabilityState;
  reason: CapabilityReason;
}>;

export function capabilityAvailable(selection: CapabilityAvailability) {
  return selection.state === "enabled" && selection.mode !== "disabled";
}
