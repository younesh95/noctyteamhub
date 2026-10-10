export function positionAt(keys, time) {
  const sorted = [...keys].sort((a, b) => b.time - a.time);
  if (!sorted.length) return { x: 500, y: 500 };
  if (time >= sorted[0].time) return sorted[0];
  for (let i = 1; i < sorted.length; i++)
    if (time >= sorted[i].time) {
      const a = sorted[i - 1],
        b = sorted[i],
        t = (a.time - time) / (a.time - b.time);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  return sorted.at(-1);
}
export function putKey(keys, point, time) {
  return [...keys.filter((k) => k.time !== time), { ...point, time }].sort(
    (a, b) => b.time - a.time,
  );
}
export function migratePad(data) {
  if (data.stratpad?.version === 1) return structuredClone(data.stratpad);
  return {
    version: 1,
    objects: (data.points || []).map((p, i) => ({
      id: "legacy-" + i,
      tool: /^[1-5]$/.test(p.label) ? "Joueur" : p.label,
      side: data.side || "T",
      label: p.label,
      color: "#b695ff",
      level: p.level || "upper",
      time: 135,
      duration: 20,
      width: 4,
      points: [{ x: p.x * 10, y: p.y * 10 }],
      keys: [{ x: p.x * 10, y: p.y * 10, time: 135 }],
    })),
  };
}
export function visibleAt(o, time, timed) {
  return (
    !timed ||
    !["Smoke", "Flash", "Molotov", "HE", "Decoy"].includes(o.tool) ||
    (time <= o.time && time >= o.time - o.duration)
  );
}
