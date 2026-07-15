export type MockAiDraft = Readonly<{ provider: "mock"; text: string; billable: false; externalSideEffect: false }>;

export function createMockAiDraft(topic: string): MockAiDraft {
  if (!/^[a-z][a-z0-9_-]{0,47}$/.test(topic)) throw new TypeError("Mock AI topic must be a bounded identifier");
  return { provider: "mock", text: `Deterministic mock draft for ${topic}.`, billable: false, externalSideEffect: false };
}
