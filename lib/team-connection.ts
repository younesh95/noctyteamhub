import { validateConnection } from "../desktop/connection-policy.mjs";
export type TeamConnection = {
  supabaseUrl: string;
  publishableKey: string;
  faceitTeamId: string;
};
export let SUPABASE_URL = "";
export let SUPABASE_KEY = "";
export let FACEIT_TEAM_ID = "";
function apply(value: unknown) {
  const c = validateConnection(value);
  SUPABASE_URL = c.supabaseUrl;
  SUPABASE_KEY = c.publishableKey;
  FACEIT_TEAM_ID = c.faceitTeamId;
  return c;
}
export async function loadConnection(): Promise<TeamConnection | null> {
  try {
    const value = window.noctys
      ? await window.noctys.getConnection()
      : JSON.parse(localStorage.getItem("noctys-team-connection") || "null");
    return value ? apply(value) : null;
  } catch {
    return null;
  }
}
export async function saveConnection(value: unknown) {
  const config = validateConnection(value);
  if (window.noctys) await window.noctys.setConnection(config);
  else localStorage.setItem("noctys-team-connection", JSON.stringify(config));
  sessionStorage.removeItem("noctys-session");
  apply(config);
}
