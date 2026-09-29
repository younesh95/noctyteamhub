const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  validateConnection,
  connectionCsp,
} = require("../desktop/connection-policy.mjs");
const sample = () => ({
  supabaseUrl: "https://example-project.supabase.co",
  publishableKey: "sb_publishable_" + "x".repeat(32),
  faceitTeamId: "",
});
test("connection config accepts public keys and normalizes the URL", () => {
  const value = sample();
  value.supabaseUrl += " /";
  assert.throws(() => validateConnection(value));
  value.supabaseUrl = "https://example-project.supabase.co/";
  assert.equal(validateConnection(value).supabaseUrl, sample().supabaseUrl);
});
test("connection config rejects privileged keys, injected hosts and extra fields", () => {
  for (const url of [
    "http://example-project.supabase.co",
    "https://example-project.supabase.co.evil.example",
    "https://user@example-project.supabase.co",
    "https://example-project.supabase.co/path",
    "https://example-project.supabase.co?url=evil",
    "https://localhost",
  ])
    assert.throws(() => validateConnection({ ...sample(), supabaseUrl: url }));
  for (const key of [
    "sb_secret_" + "x".repeat(32),
    "eyJhbGciOiJIUzI1NiJ9.payload.signature",
    "service_role",
    "",
  ])
    assert.throws(() =>
      validateConnection({ ...sample(), publishableKey: key }),
    );
  assert.throws(() =>
    validateConnection({ ...sample(), password: "forbidden" }),
  );
  assert.throws(() =>
    validateConnection({ ...sample(), faceitTeamId: "not-an-id" }),
  );
});
test("CSP restricts project connections and does not allow arbitrary origins", () => {
  const policy = connectionCsp(sample());
  assert(policy.includes("wss://example-project.supabase.co"));
  assert(policy.includes("https://example-project.storage.supabase.co"));
  assert(policy.includes("object-src 'none'"));
  assert(!policy.includes("*"));
  assert(!connectionCsp(null).includes("supabase.co"));
});
