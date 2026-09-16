let browserKey = "";
export async function keyStatus() {
  return window.noctys ? window.noctys.keyStatus() : !!browserKey;
}
export async function setKey(value: string) {
  if (window.noctys) await window.noctys.setKey(value);
  else browserKey = value.trim();
}
export async function faceit(path: string): Promise<any> {
  if (window.noctys) return window.noctys.faceit(path);
  if (!browserKey) throw Error("Saisissez une clé FACEIT dans les paramètres.");
  const r = await fetch("https://open.faceit.com/data/v4" + path, {
    headers: { Authorization: "Bearer " + browserKey },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok)
    throw Error(
      (
        {
          401: "Clé FACEIT invalide.",
          403: "Accès refusé.",
          404: "Profil ou statistiques introuvables.",
          429: "Limite FACEIT atteinte. Réessayez plus tard.",
        } as any
      )[r.status] || "FACEIT indisponible.",
    );
  return r.json();
}
export function teamId(value: string) {
  const m = value.trim().match(/(?:teams\/)?([a-f0-9]{8}-[a-f0-9-]{27,})/i);
  if (!m) throw Error("Indiquez l’URL ou l’identifiant de l’équipe FACEIT.");
  return m[1];
}
export function summarize(stats: Record<string, string> = {}) {
  const n = (...names: string[]) => {
    for (const name of names) {
      if (stats[name] != null && stats[name] !== "") {
        const v = Number(stats[name]);
        if (Number.isFinite(v)) return v;
      }
    }
    return null;
  };
  const kd = n("Average K/D Ratio", "K/D Ratio"),
    hs = n("Average Headshots %", "Headshots %"),
    win = n("Win Rate %"),
    matches = n("Matches");
  const axes: string[] = [];
  if (kd !== null && kd < 1)
    axes.push(
      "Revoir les morts précoces et les distances de trade : le K/D moyen est inférieur à 1.",
    );
  if (hs !== null && hs < 40)
    axes.push(
      "Vérifier le placement du viseur et le premier tir, en tenant compte du rôle AWP.",
    );
  if (win !== null && win < 50)
    axes.push(
      "Comparer les rounds perdus par side et la conversion des avantages en review.",
    );
  if (!axes.length)
    axes.push(
      "Aucun axe automatique évident : compléter ces chiffres par une review des décisions.",
    );
  return { kd, hs, win, matches, axes };
}
