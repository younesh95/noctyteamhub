"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  maps,
  Row,
  download,
  downloadBlob,
  clock,
} from "../../lib/domain/model";
type Point = { x: number; y: number };
type Mark = {
  id: string;
  tool: string;
  color: string;
  label: string;
  time: number;
  points: Point[];
  level: string;
};
type Plan = { map: string; level: string; side: string; marks: Mark[] };
const initial: Plan = { map: "Mirage", level: "upper", side: "T", marks: [] };
const tools = [
  "Déplacer",
  "Joueur",
  "Flèche",
  "Dessin",
  "Smoke",
  "Flash",
  "Molotov",
  "HE",
  "Texte",
  "Effacer",
];
export default function TacticalBoard({
  rows,
  save,
  editable,
  demo,
}: {
  rows: Row[];
  save: (r: Row) => Promise<boolean>;
  editable: boolean;
  demo: boolean;
}) {
  const [plan, setPlan] = useState<Plan>(initial),
    [id, setId] = useState(""),
    [title, setTitle] = useState("Nouveau plan"),
    [tool, setTool] = useState("Joueur"),
    [color, setColor] = useState("#b695ff"),
    [label, setLabel] = useState("1"),
    [time, setTime] = useState(115),
    [past, setPast] = useState<Plan[]>([]),
    [future, setFuture] = useState<Plan[]>([]),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [confirm, setConfirm] = useState<Row | null | false>(false),
    [zoom, setZoom] = useState(1);
  const svg = useRef<SVGSVGElement>(null),
    gesture = useRef<{
      before: Plan;
      id: string;
      start: Point;
      original?: Mark;
    } | null>(null);
  const boards = rows.filter((r) => r.kind === "board");
  const background =
    "/radars/" +
    plan.map.toLowerCase() +
    (plan.map === "Nuke" && plan.level === "lower" ? "-lower" : "") +
    ".png";
  function change(next: Plan) {
    setPast((p) => [...p.slice(-49), plan]);
    setFuture([]);
    setPlan(next);
    setDirty(true);
    setStatus("Modifications non enregistrées");
  }
  function open(row: Row | null) {
    if (dirty) {
      setConfirm(row);
      return;
    }
    load(row);
  }
  function load(row: Row | null) {
    setId(row?.id || "");
    setTitle(row?.title || "Nouveau plan");
    setPlan(
      row ? { ...initial, ...row.data, map: row.map || "Mirage" } : initial,
    );
    setPast([]);
    setFuture([]);
    setDirty(false);
    setStatus("");
    setConfirm(false);
  }
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function point(e: React.PointerEvent) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1000, ((e.clientX - r.left) / r.width) * 1000)),
      y: Math.max(0, Math.min(1000, ((e.clientY - r.top) / r.height) * 1000)),
    };
  }
  function down(e: React.PointerEvent<SVGSVGElement>) {
    if (!editable) return;
    const p = point(e);
    const hit = (e.target as Element)
      .closest("[data-mark]")
      ?.getAttribute("data-mark");
    if (tool === "Effacer") {
      if (hit)
        change({ ...plan, marks: plan.marks.filter((m) => m.id !== hit) });
      return;
    }
    if (tool === "Déplacer") {
      const original = plan.marks.find((m) => m.id === hit);
      if (original) {
        gesture.current = { before: plan, id: original.id, start: p, original };
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return;
    }
    if (plan.marks.length >= 500) {
      setStatus("Maximum 500 objets par plan.");
      return;
    }
    const m: Mark = {
      id: crypto.randomUUID(),
      tool,
      color,
      label,
      time,
      points: [p],
      level: plan.level,
    };
    if (["Flèche", "Dessin"].includes(tool)) {
      gesture.current = { before: plan, id: m.id, start: p };
      setPlan({ ...plan, marks: [...plan.marks, m] });
      e.currentTarget.setPointerCapture(e.pointerId);
    } else change({ ...plan, marks: [...plan.marks, m] });
  }
  function move(e: React.PointerEvent<SVGSVGElement>) {
    const g = gesture.current;
    if (!g) return;
    const p = point(e);
    setPlan((current) => ({
      ...current,
      marks: current.marks.map((m) =>
        m.id !== g.id
          ? m
          : g.original
            ? {
                ...m,
                points: g.original.points.map((q) => ({
                  x: Math.max(0, Math.min(1000, q.x + p.x - g.start.x)),
                  y: Math.max(0, Math.min(1000, q.y + p.y - g.start.y)),
                })),
              }
            : {
                ...m,
                points:
                  m.tool === "Flèche"
                    ? [g.start, p]
                    : [...m.points.slice(-1999), p],
              },
      ),
    }));
  }
  function up() {
    if (!gesture.current) return;
    const before = gesture.current.before;
    setPast((p) => [...p.slice(-49), before]);
    setFuture([]);
    gesture.current = null;
    setDirty(true);
    setStatus("Modifications non enregistrées");
  }
  async function exportImage() {
    try {
      const clone = svg.current!.cloneNode(true) as SVGSVGElement;
      const response = await fetch(background);
      if (!response.ok) throw Error("Fond radar indisponible");
      const blob = await response.blob();
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      clone.querySelector("image")?.setAttribute("href", data);
      clone.setAttribute("width", "1600");
      clone.setAttribute("height", "1600");
      downloadBlob(
        title + ".svg",
        new Blob([new XMLSerializer().serializeToString(clone)], {
          type: "image/svg+xml",
        }),
      );
      setStatus("Image SVG exportée avec le radar et les annotations.");
    } catch (e) {
      setStatus((e as Error).message);
    }
  }
  return (
    <div className="tactical-layout">
      <aside className="panel board-library">
        <span className="eyebrow">PLAYBOOK / TABLEAUX</span>
        <h3>Plans de l’équipe</h3>
        {editable && (
          <button className="primary" onClick={() => open(null)}>
            ＋ Nouveau tableau
          </button>
        )}
        {boards.map((r) => (
          <button
            key={r.id}
            className={id === r.id ? "selected" : ""}
            onClick={() => open(r)}
          >
            <strong>{r.title}</strong>
            <small>
              {r.map} · {r.data.side} · {r.data.marks?.length || 0} objets
            </small>
          </button>
        ))}
        {!boards.length && (
          <p className="fine">
            Enregistrez votre premier setup pour le partager.
          </p>
        )}
        <p className="fine">
          {demo
            ? "Exploration : sauvegarde temporaire."
            : "Les plans enregistrés sont partagés avec les membres actifs."}
        </p>
      </aside>
      <section className="panel tactical-editor">
        <div className="board-top">
          <label>
            Nom du plan
            <input
              value={title}
              maxLength={150}
              disabled={!editable}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
            />
          </label>
          <label>
            Map
            <select
              value={plan.map}
              disabled={!editable}
              onChange={(e) =>
                change({ ...plan, map: e.target.value, level: "upper" })
              }
            >
              {maps.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Side
            <select
              value={plan.side}
              disabled={!editable}
              onChange={(e) => change({ ...plan, side: e.target.value })}
            >
              <option>T</option>
              <option>CT</option>
            </select>
          </label>
          {plan.map === "Nuke" && (
            <label>
              Niveau
              <select
                value={plan.level}
                onChange={(e) => setPlan({ ...plan, level: e.target.value })}
              >
                <option value="upper">Supérieur</option>
                <option value="lower">Inférieur</option>
              </select>
            </label>
          )}
        </div>
        <div className="tactical-tools">
          {tools.map((t) => (
            <button
              disabled={!editable}
              aria-pressed={tool === t}
              className={tool === t ? "on" : ""}
              key={t}
              onClick={() => setTool(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="board-options">
          <label>
            Couleur
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>
          <label>
            Joueur / texte
            <input
              value={label}
              maxLength={60}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <label>
            Timing {clock(time)}
            <input
              type="range"
              min="5"
              max="135"
              value={time}
              onChange={(e) => setTime(+e.target.value)}
            />
          </label>
          <label>
            Zoom
            <select value={zoom} onChange={(e) => setZoom(+e.target.value)}>
              <option value="1">100 %</option>
              <option value="1.5">150 %</option>
              <option value="2">200 %</option>
            </select>
          </label>
        </div>
        <div className="radar-scroll">
          <svg
            ref={svg}
            viewBox="0 0 1000 1000"
            className="radar-canvas"
            style={{ width: zoom * 100 + "%" }}
            role="application"
            aria-label={"Tableau tactique " + plan.map}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={() => {
              if (gesture.current) setPlan(gesture.current.before);
              gesture.current = null;
            }}
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
              </marker>
            </defs>
            <rect width="1000" height="1000" fill="#0a0e16" />
            <image href={background} width="1000" height="1000" />
            {plan.marks
              .filter((m) => m.level === plan.level)
              .map((m) => (
                <g
                  data-mark={m.id}
                  key={m.id}
                  style={{ cursor: tool === "Déplacer" ? "move" : "crosshair" }}
                >
                  {["Flèche", "Dessin"].includes(m.tool) ? (
                    <polyline
                      points={m.points.map((p) => p.x + "," + p.y).join(" ")}
                      fill="none"
                      stroke={m.color}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      markerEnd={
                        m.tool === "Flèche" ? "url(#arrow)" : undefined
                      }
                    />
                  ) : (
                    <>
                      <circle
                        cx={m.points[0].x}
                        cy={m.points[0].y}
                        r={m.tool === "Smoke" ? 38 : 22}
                        fill={m.tool === "Smoke" ? m.color + "77" : "#10121d"}
                        stroke={m.color}
                        strokeWidth="4"
                      />
                      <text
                        x={m.points[0].x}
                        y={m.points[0].y + 6}
                        textAnchor="middle"
                        fill="white"
                        fontSize={m.tool === "Texte" ? 18 : 16}
                        fontFamily="Arial"
                      >
                        {m.tool === "Joueur" || m.tool === "Texte"
                          ? m.label
                          : (
                              {
                                Smoke: "S",
                                Flash: "F",
                                Molotov: "M",
                                HE: "HE",
                              } as any
                            )[m.tool]}
                      </text>
                    </>
                  )}
                  <text
                    x={m.points[0].x}
                    y={m.points[0].y - 30}
                    fill={m.color}
                    stroke="#000"
                    strokeWidth="2"
                    paintOrder="stroke"
                    fontFamily="Arial"
                    fontSize="17"
                  >
                    {clock(m.time)}
                  </text>
                </g>
              ))}
          </svg>
        </div>
        <div className="board-actions">
          <button
            disabled={!past.length || !editable}
            onClick={() => {
              setFuture((f) => [plan, ...f]);
              setPlan(past[past.length - 1]);
              setPast((p) => p.slice(0, -1));
              setDirty(true);
            }}
          >
            ↶ Annuler
          </button>
          <button
            disabled={!future.length || !editable}
            onClick={() => {
              setPast((p) => [...p, plan]);
              setPlan(future[0]);
              setFuture((f) => f.slice(1));
              setDirty(true);
            }}
          >
            ↷ Rétablir
          </button>
          <button onClick={exportImage}>Exporter image SVG</button>
          <button onClick={() => download(title, { ...plan, title })}>
            Exporter JSON
          </button>
          {editable && (
            <button
              className="primary"
              disabled={busy || !title.trim()}
              onClick={async () => {
                setBusy(true);
                const row = rows.find((r) => r.id === id);
                const nextId = id || crypto.randomUUID();
                try {
                  const ok = await save({
                    ...row,
                    id: nextId,
                    kind: "board",
                    scope: "team",
                    title: title.trim(),
                    body: "",
                    map: plan.map,
                    data: plan,
                  });
                  if (ok) {
                    setId(nextId);
                    setDirty(false);
                    setStatus(
                      demo
                        ? "Plan sauvegardé pour cette démonstration."
                        : "Plan partagé enregistré.",
                    );
                  } else
                    setStatus(
                      "Échec de sauvegarde. Votre dessin est conservé. Vérifiez la migration 002.",
                    );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Enregistrement…" : "Enregistrer le plan"}
            </button>
          )}
        </div>
        <p className="fine" role="status">
          {status ||
            "Cliquez pour placer un objet. Glissez pour tracer ou déplacer. Chaque objet conserve son timing."}
        </p>
        <p className="fine">
          Radars : Valve Corporation, distribués via cs2-map-icons. Positions de
          préparation, sans connexion au jeu.
        </p>
      </section>
      {confirm !== false && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Modifications non enregistrées"
          >
            <h3>Quitter ce dessin sans enregistrer ?</h3>
            <button onClick={() => setConfirm(false)}>
              Continuer le dessin
            </button>
            <button onClick={() => load(confirm)}>
              Abandonner les modifications
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
