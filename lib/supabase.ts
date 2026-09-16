export const SUPABASE_URL = "https://adrleyvcufedeologxnx.supabase.co";
export const SUPABASE_KEY = "sb_publishable_QUi-yYaY9X3etHap3wfx9Q_BTdOt0Ty";
let accessToken = "";
export function session() {
  return typeof window === "undefined"
    ? null
    : JSON.parse(sessionStorage.getItem("noctys-session") || "null");
}
export async function api(path: string, options: RequestInit = {}) {
  const s = session();
  accessToken = s?.access_token || SUPABASE_KEY;
  const r = await fetch(SUPABASE_URL + path, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await r.text();
  let d;
  try {
    d = JSON.parse(text);
  } catch {
    d = text;
  }
  if (!r.ok) {
    if (d?.code === "email_address_not_authorized")
      throw new Error(
        "Supabase ne peut pas envoyer d’email à cette adresse. Le staff doit configurer un serveur SMTP pour les membres de l’équipe.",
      );
    if (r.status === 429)
      throw new Error(
        "Trop de demandes d’email. Patientez, puis réessayez ; si le problème persiste, contactez le staff.",
      );
    if (path === "/auth/v1/signup" && d?.code === "unexpected_failure")
      throw new Error(
        "Création du compte impossible. Vérifiez notamment que ce pseudo NOCTYS n’est pas déjà utilisé, puis contactez le staff si besoin.",
      );
    throw new Error(
      d?.msg ||
        d?.message ||
        d?.error_description ||
        "Connexion impossible. Réessayez.",
    );
  }
  return d;
}
export async function auth(
  mode: string,
  f: Record<string, FormDataEntryValue>,
) {
  if (mode === "signup") {
    return api("/auth/v1/signup", {
      method: "POST",
      body: JSON.stringify({
        email: f.email,
        password: f.password,
        data: {
          username: f.username,
          faceit: f.faceit,
          requested_role: f.role,
        },
      }),
    });
  }
  if (window.noctys) {
    const d = await window.noctys.login(f);
    d.expires_at =
      d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600);
    sessionStorage.setItem("noctys-session", JSON.stringify(d));
    return;
  }
  const r = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(f),
  });
  const d: any = await r.json();
  if (!r.ok) throw new Error(d.error || "Connexion impossible");
  d.expires_at =
    d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600);
  sessionStorage.setItem("noctys-session", JSON.stringify(d));
}
export async function refreshSession() {
  const s = session();
  if (!s) return null;
  if (s.expires_at * 1000 < Date.now() + 60000) {
    try {
      const d = await api("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: JSON.stringify({ refresh_token: s.refresh_token }),
      });
      d.expires_at =
        d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600);
      sessionStorage.setItem("noctys-session", JSON.stringify(d));
      return d;
    } catch {
      sessionStorage.removeItem("noctys-session");
      return null;
    }
  }
  return s;
}
export async function upload(file: File, user: string) {
  const path =
    user +
    "/" +
    crypto.randomUUID() +
    "-" +
    file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  await api("/storage/v1/object/team-files/" + path, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  return path;
}
export async function fileUrl(path: string) {
  const d = await api("/storage/v1/object/sign/team-files/" + path, {
    method: "POST",
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  return SUPABASE_URL + "/storage/v1" + d.signedURL;
}
