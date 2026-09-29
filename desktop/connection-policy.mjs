// Only public client configuration is accepted. Never accept privileged keys.
export function validateConnection(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Fichier de connexion invalide.");
  if (
    Object.keys(value).some(
      (k) => !["supabaseUrl", "publishableKey", "faceitTeamId"].includes(k),
    )
  )
    throw Error(
      "Le fichier doit contenir uniquement la configuration publique de connexion.",
    );
  const supabaseUrl =
    typeof value.supabaseUrl === "string"
      ? value.supabaseUrl.trim().replace(/\/$/, "")
      : "";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl))
    throw Error("Utilisez l’URL HTTPS officielle du projet Supabase.");
  const publishableKey =
    typeof value.publishableKey === "string" ? value.publishableKey.trim() : "";
  if (!/^sb_publishable_[A-Za-z0-9_-]{20,200}$/.test(publishableKey))
    throw Error(
      "Seule une clé publique publishable est acceptée. Ne saisissez jamais de clé secrète ou service_role.",
    );
  const faceitTeamId =
    typeof value.faceitTeamId === "string" ? value.faceitTeamId.trim() : "";
  if (
    faceitTeamId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      faceitTeamId,
    )
  )
    throw Error("Identifiant d’équipe FACEIT invalide.");
  return { supabaseUrl, publishableKey, faceitTeamId };
}

export function connectionCsp(value) {
  const c = value ? validateConnection(value) : null;
  const url = c?.supabaseUrl || "";
  const connections = c
    ? `${url} ${url.replace("https:", "wss:")} ${url.replace(".supabase.co", ".storage.supabase.co")}`
    : "";
  return `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${url}; connect-src 'self' ${connections}; object-src 'none'; frame-src https://meet.jit.si; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`;
}
