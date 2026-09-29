const { test } = require("node:test");
const fs = require("node:fs");
const { checkPublicData } = require("../scripts/check-public-data.mjs");
test("public application sources do not embed team connection or personal identifiers", () => {
  checkPublicData([
    "app",
    "desktop",
    "features",
    "lib",
    "public",
    ".github",
    "supabase",
    ...fs.readdirSync(".").filter((f) => f.endsWith(".md")),
  ]);
});
