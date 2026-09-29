// A local, explainable opponent model. Scores express preferences, not win rates.
export function defaultBot() {
  return {
    mode: "opponent",
    variation: 10,
    seed: "noctys-1",
    profiles: {
      A: { bans: [], strengths: [] },
      B: { bans: [], strengths: [] },
    },
  };
}

export function validateBot(config, pool) {
  if (!config || !["manual", "opponent", "both"].includes(config.mode))
    return "Mode du bot invalide.";
  if (
    !Number.isInteger(config.variation) ||
    config.variation < 0 ||
    config.variation > 30
  )
    return "La variation doit être comprise entre 0 et 30.";
  if (
    typeof config.seed !== "string" ||
    !config.seed.trim() ||
    config.seed.length > 80
  )
    return "Indiquez une graine de simulation (1 à 80 caractères).";
  for (const team of ["A", "B"]) {
    for (const kind of ["bans", "strengths"]) {
      const list = config.profiles?.[team]?.[kind];
      if (
        !Array.isArray(list) ||
        list.length > pool.length ||
        new Set(list).size !== list.length ||
        list.some((m) => !pool.includes(m))
      )
        return "Chaque classement doit contenir des maps du pool, sans doublon.";
    }
  }
  return "";
}

function rank(list, map, neutral = 0) {
  const i = list.indexOf(map);
  return i < 0 ? neutral : (7 - i) / 7;
}

function noise(key) {
  let n = 2166136261;
  for (const c of key) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  n ^= n >>> 16;
  n = Math.imul(n, 0x45d9f3b);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

export function chooseMap(pool, steps, history, config) {
  const error = validateBot(config, pool);
  if (error) throw Error(error);
  if (
    pool.length !== 7 ||
    new Set(pool).size !== 7 ||
    steps.length !== 6 ||
    history.length > 6 ||
    new Set(history).size !== history.length ||
    history.some((m) => !pool.includes(m))
  )
    throw Error("État du veto invalide.");
  const step = steps[history.length];
  if (!step) return null;
  if (!["A", "B"].includes(step.team) || !["pick", "ban"].includes(step.action))
    throw Error("Étape invalide.");
  const own = config.profiles[step.team];
  const enemy = config.profiles[step.team === "A" ? "B" : "A"];
  const candidates = pool
    .filter((m) => !history.includes(m))
    .map((map) => {
      const ban = rank(own.bans, map);
      const strength = rank(own.strengths, map, 0.5);
      const threat = rank(enemy.strengths, map, 0.5);
      const enemyBan = rank(enemy.bans, map);
      const base =
        step.action === "ban"
          ? 0.58 * ban + 0.27 * threat + 0.15 * (1 - strength)
          : 0.55 * strength +
            0.3 * (strength - threat) +
            0.15 * enemyBan -
            0.2 * ban;
      const variation =
        ((noise(
          `${config.seed}|${history.join(",")}|${step.team}|${step.action}|${map}`,
        ) -
          0.5) *
          config.variation) /
        100;
      return { map, score: base + variation };
    })
    .sort(
      (a, b) => b.score - a.score || pool.indexOf(a.map) - pool.indexOf(b.map),
    );
  const selected = candidates[0];
  const parts = [];
  const ownBan = own.bans.indexOf(selected.map),
    ownStrong = own.strengths.indexOf(selected.map),
    enemyStrong = enemy.strengths.indexOf(selected.map),
    enemyBanned = enemy.bans.indexOf(selected.map);
  if (ownBan >= 0) parts.push(`ban habituel n°${ownBan + 1}`);
  if (ownStrong >= 0) parts.push(`force de l’équipe n°${ownStrong + 1}`);
  if (enemyStrong >= 0) parts.push(`force adverse n°${enemyStrong + 1}`);
  if (enemyBanned >= 0 && step.action === "pick")
    parts.push(`ban adverse habituel n°${enemyBanned + 1}`);
  const informed =
    [...own.bans, ...own.strengths, ...enemy.bans, ...enemy.strengths].length >
    0;
  return {
    ...step,
    map: selected.map,
    source: "bot",
    reason: informed
      ? `Compromis ${step.action === "ban" ? "habitudes de ban / menace adverse / force propre" : "force propre / avantage relatif / bans adverses"}${parts.length ? " : " + parts.join(", ") : "; informations neutres pour cette map"}.`
      : "Aucun profil renseigné : choix neutre, départagé par la graine et la variation.",
    candidates: candidates.map((c) => ({
      ...c,
      score: Math.round(c.score * 1000) / 1000,
    })),
  };
}
