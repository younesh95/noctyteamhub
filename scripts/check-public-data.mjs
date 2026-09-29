import fs from "node:fs";
import path from "node:path";
// Fail closed on embedded team configuration and common personal identifiers.
// Test examples use reserved host names and constructed dummy keys.
export function checkPublicData(roots) {
  const failures = [];
  const patterns = [
    /sb_(?:publishable|secret)_[A-Za-z0-9_-]{20,}/,
    /7656119\d{10}/,
    /[\w.+-]+@(?:gmail|hotmail|outlook|yahoo)\.[a-z]+/i,
    /appgprj_[a-z0-9]+/,
  ];
  function visit(file) {
    if (fs.statSync(file).isDirectory()) {
      for (const name of fs.readdirSync(file)) visit(path.join(file, name));
      return;
    }
    if (
      !/\.(?:[cm]?js|[cm]?tsx?|json|md|sql|yml|yaml|html|css|toml|txt)$/.test(
        file,
      )
    )
      return;
    const value = fs.readFileSync(file, "utf8");
    const hosts = [
      ...value.matchAll(/https:\/\/([a-z0-9-]+)\.(?:storage\.)?supabase\.co/g),
    ].map((m) => m[1]);
    if (
      patterns.some((p) => p.test(value)) ||
      hosts.some((h) => !["example-project", "votre-projet"].includes(h))
    )
      failures.push(file);
  }
  for (const root of roots) if (fs.existsSync(root)) visit(root);
  if (failures.length)
    throw Error(
      "Embedded identifying data detected in: " + failures.join(", "),
    );
  return true;
}
