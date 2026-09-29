export function defaultSteps(format) {
  return (
    format === "BO3"
      ? ["ban", "ban", "pick", "pick", "ban", "ban"]
      : Array(6).fill("ban")
  ).map((action, i) => ({ team: i % 2 === 0 ? "A" : "B", action }));
}
export function validateSteps(format, steps) {
  if (
    !["BO1", "BO3"].includes(format) ||
    !Array.isArray(steps) ||
    steps.length !== 6
  )
    return "Six étapes sont nécessaires pour un pool de sept maps.";
  if (
    steps.some(
      (s) =>
        !["A", "B"].includes(s.team) || !["ban", "pick"].includes(s.action),
    )
  )
    return "Étape invalide.";
  const picks = steps.filter((s) => s.action === "pick").length;
  if (picks !== (format === "BO3" ? 2 : 0))
    return format === "BO3"
      ? "Un BO3 demande deux picks et quatre bans."
      : "Un BO1 demande six bans.";
  return "";
}
export function simulate(format, pool, steps, history) {
  const error = validateSteps(format, steps);
  if (error) throw Error(error);
  if (pool.length !== 7 || new Set(pool).size !== 7)
    throw Error("Le pool doit contenir sept maps distinctes.");
  if (!Array.isArray(history) || history.length > steps.length)
    throw Error("Historique invalide.");
  const remaining = [...pool],
    picks = [],
    turns = [];
  history.forEach((map, i) => {
    if (!remaining.includes(map))
      throw Error("Cette map a déjà été jouée ou ne fait pas partie du pool.");
    remaining.splice(remaining.indexOf(map), 1);
    const turn = { ...steps[i], map };
    turns.push(turn);
    if (turn.action === "pick") picks.push(map);
  });
  const complete = history.length === 6;
  return {
    remaining,
    turns,
    picks,
    complete,
    decider: complete ? remaining[0] : null,
    next: complete ? null : steps[history.length],
  };
}
