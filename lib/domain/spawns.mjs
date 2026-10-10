export const SPAWNS = Object.freeze(
  Array.from({ length: 5 }, (_, i) => ({
    id: String(i + 1),
    name: `Spawn ${i + 1}`,
    position:
      i === 0
        ? "Le plus à droite"
        : i === 4
          ? "Le plus à gauche"
          : i === 2
            ? "Centre"
            : i === 1
              ? "À droite du centre"
              : "À gauche du centre",
  })),
);
export const isSpawnStrategy = (data) => data?.type === "Selon les spawns";
export function strategyLanes(data, players, player = "Tous", spawn = "Tous") {
  return isSpawnStrategy(data)
    ? SPAWNS.filter((s) => spawn === "Tous" || spawn === s.id).map((s) => ({
        id: s.id,
        username: s.name,
        role: s.position,
      }))
    : players.filter(
        (p) =>
          ["joueur", "IGL"].includes(p.role) &&
          (player === "Tous" || p.id === player),
      );
}
export function actionLane(data, action) {
  return isSpawnStrategy(data)
    ? String(action.spawn || String(action.player || "").replace(/^spawn-/, ""))
    : action.player;
}
