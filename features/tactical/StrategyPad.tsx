"use client";
import React, { useEffect, useRef, useState, useId } from "react";
import { Row, clock, download, downloadBlob } from "../../lib/domain/model";
import {
  migratePad,
  positionAt,
  putKey,
  visibleAt,
} from "./stratpad-engine.mjs";
import "./stratpad.css";
type Point = { x: number; y: number };
type Key = Point & { time: number };
type Item = {
  id: string;
  tool: string;
  side: string;
  label: string;
  color: string;
  level: string;
  time: number;
  duration: number;
  width: number;
  points: Point[];
  keys: Key[];
};
type Pad = { version: number; objects: Item[] };
const tools = [
  "Sélection",
  "Joueur",
  "Flèche",
  "Ligne",
  "Dessin",
  "Rectangle",
  "Ellipse",
  "Texte",
  "Smoke",
  "Flash",
  "Molotov",
  "HE",
  "Decoy",
  "Bombe",
  "Effacer",
];
export default function StrategyPad({
  row,
  save,
  editable,
}: {
  row: Row;
  save: (r: Row) => Promise<boolean>;
  editable: boolean;
}) {
  const draftKey = "noctys-stratpad-draft-" + row.id;
  const [draft] = useState(() => {
    try { const d=JSON.parse(sessionStorage.getItem(draftKey)||'null'); return d?.pad?.version===1 ? d : null; } catch { return null; }
  });
  const [pad, setPad] = useState<Pad>(() => {
    if(draft)return draft.pad;
    return migratePad(row.data);
  });
  const [dirty, setDirty] = useState(!!draft),
    [tool, setTool] = useState("Sélection"),
    [side, setSide] = useState(row.data.side || "T"),
    [label, setLabel] = useState("1"),
    [color, setColor] = useState("#b695ff"),
    [width, setWidth] = useState(4),
    [time, setTime] = useState(135),
    [level, setLevel] = useState("upper"),
    [zoom, setZoom] = useState(1),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [timed, setTimed] = useState(false),
    [selected, setSelected] = useState(""),
    [past, setPast] = useState<Pad[]>([]),
    [future, setFuture] = useState<Pad[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState(false);
  const svg = useRef<SVGSVGElement>(null),
    latest = useRef(pad),
    version = useRef(draft ? draft.version : row.updated_at),
    gesture = useRef<{
      before: Pad;
      id: string;
      start: Point;
      pointer: number;
    } | null>(null);
  const marker = useId().replace(/:/g, "");
  const radar =
    "/radars/" +
    (row.map === "Dust II" ? "dust2" : (row.map || "Mirage").toLowerCase()) +
    (row.map === "Nuke" && level === "lower" ? "-lower" : "") +
    ".png";
  latest.current = pad;
  useEffect(() => {
    setFailed(false);
  }, [radar]);
  useEffect(() => {
    if (!dirty) {
      setPad(migratePad(row.data));
      version.current = row.updated_at;
    }
  }, [row.updated_at, dirty]);
  useEffect(() => {
    if (dirty && editable) {
      try {
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({ version: version.current, pad }),
        );
      } catch {
        setMessage(
          "Brouillon local indisponible : enregistrez avant de quitter.",
        );
      }
    }
  }, [pad, dirty, editable, draftKey]);
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
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(),
        delta = ((now - last) / 1000) * speed;
      last = now;
      setTime((t) => {
        if (t - delta <= 5) {
          setPlaying(false);
          return 5;
        }
        return t - delta;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [playing, speed]);
  function commit(next: Pad, before = pad) {
    setPast((v) => [...v.slice(-39), before]);
    setFuture([]);
    setPad(next);
    setDirty(true);
    setMessage("");
  }
  function point(e: React.PointerEvent) {
    const p = svg.current!.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const q = p.matrixTransform(svg.current!.getScreenCTM()!.inverse());
    return {
      x: Math.max(0, Math.min(1000, q.x)),
      y: Math.max(0, Math.min(1000, q.y)),
    };
  }
  function down(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0 || !editable || busy || playing) return;
    const p = point(e),
      hit = (e.target as Element)
        .closest("[data-item]")
        ?.getAttribute("data-item");
    if (tool === "Effacer") {
      if (hit)
        commit({ ...pad, objects: pad.objects.filter((o) => o.id !== hit) });
      return;
    }
    if (tool === "Sélection") {
      setSelected(hit || "");
      if (!hit) return;
      gesture.current = {
        before: pad,
        id: hit,
        start: p,
        pointer: e.pointerId,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (pad.objects.length >= 500) {
      setMessage("Limite de 500 objets atteinte.");
      return;
    }
    const t = Math.round(time),
      id = crypto.randomUUID();
    if (
      tool === "Joueur" &&
      pad.objects.some(
        (o) => o.tool === "Joueur" && o.side === side && o.label === label,
      )
    ) {
      setMessage(
        "Ce joueur existe déjà. Déplacez-le avec Sélection au timing souhaité.",
      );
      return;
    }
    const item: Item = {
      id,
      tool,
      side,
      label: tool === "Joueur" || tool === "Texte" ? label : tool,
      color: tool === "Joueur" ? (side === "T" ? "#f1b64a" : "#69b6ff") : color,
      level,
      time: t,
      duration: tool === "Smoke" ? 20 : tool === "Molotov" ? 7 : 2,
      width,
      points: [p],
      keys: [{ ...p, time: t }],
    };
    const next = { ...pad, objects: [...pad.objects, item] };
    setSelected(id);
    if (["Flèche", "Ligne", "Dessin", "Rectangle", "Ellipse"].includes(tool)) {
      gesture.current = { before: pad, id, start: p, pointer: e.pointerId };
      setPad(next);
      e.currentTarget.setPointerCapture(e.pointerId);
    } else commit(next);
  }
  function move(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g) return;
    const p = point(e);
    setPad((current) => ({
      ...current,
      objects: current.objects.map((o) => {
        if (o.id !== g.id) return o;
        if (tool === "Sélection") {
          const original = g.before.objects.find((v) => v.id === g.id)!;
          if (o.tool === "Joueur")
            return { ...o, keys: putKey(original.keys, p, Math.round(time)) };
          const dx = p.x - g.start.x,
            dy = p.y - g.start.y;
          return {
            ...o,
            points: original.points.map((q) => ({
              x: Math.max(0, Math.min(1000, q.x + dx)),
              y: Math.max(0, Math.min(1000, q.y + dy)),
            })),
          };
        }
        return {
          ...o,
          points:
            tool === "Dessin" ? [...o.points.slice(0, 1999), p] : [g.start, p],
        };
      }),
    }));
  }
  function up() {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    commit(latest.current, g.before);
  }
  function undo() {
    if (!past.length) return;
    setFuture((v) => [pad, ...v]);
    setPad(past.at(-1)!);
    setPast((v) => v.slice(0, -1));
    setDirty(true);
  }
  function redo() {
    if (!future.length) return;
    setPast((v) => [...v, pad]);
    setPad(future[0]);
    setFuture((v) => v.slice(1));
    setDirty(true);
  }
  const picked = pad.objects.find((o) => o.id === selected);
  async function exportImage() {
    try {
      const clone = svg.current!.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", "1000");
      clone.setAttribute("height", "1000");
      const blob = await (await fetch(radar)).blob();
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      clone.querySelector("image")?.setAttribute("href", data);
      downloadBlob(
        row.title + "-tableau.svg",
        new Blob([new XMLSerializer().serializeToString(clone)], {
          type: "image/svg+xml",
        }),
      );
    } catch {
      setMessage("Export impossible : vérifiez le radar.");
    }
  }
  return (
    <div className="stratpad">
      <div className="stratpad-heading">
        <div>
          <span className="eyebrow">
            STRATPAD / {row.map} / {row.data.side}
          </span>
          <h3>Construire le round</h3>
        </div>
        <span className="badge">
          {dirty ? "Brouillon non enregistré" : "Plan enregistré"}
        </span>
      </div>
      <div className="stratpad-tools">
        {tools.map((t) => (
          <button
            key={t}
            disabled={!editable || busy || playing}
            aria-pressed={tool === t}
            className={tool === t ? "on" : ""}
            onClick={() => setTool(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="stratpad-options">
        <label>
          Camp
          <select value={side} onChange={(e) => setSide(e.target.value)}>
            <option>T</option>
            <option>CT</option>
          </select>
        </label>
        <label>
          {tool === "Texte" ? "Texte" : "Numéro / libellé"}
          <input
            maxLength={60}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <label>
          Couleur
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <label>
          Épaisseur
          <select value={width} onChange={(e) => setWidth(+e.target.value)}>
            <option value="3">Fine</option>
            <option value="4">Normale</option>
            <option value="8">Épaisse</option>
          </select>
        </label>
        {row.map === "Nuke" && (
          <label>
            Étage
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="upper">Supérieur</option>
              <option value="lower">Inférieur</option>
            </select>
          </label>
        )}
        <label>
          Zoom
          <select value={zoom} onChange={(e) => setZoom(+e.target.value)}>
            <option value="1">100 %</option>
            <option value="1.5">150 %</option>
            <option value="2">200 %</option>
          </select>
        </label>
      </div>
      <div className="stratpad-layout">
        <div className="stratpad-map">
          <svg
            ref={svg}
            style={{ width: zoom * 100 + "%" }}
            viewBox="0 0 1000 1000"
            role="application"
            aria-label={"Stratpad " + row.map}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={() => {
              if (gesture.current) setPad(gesture.current.before);
              gesture.current = null;
            }}
          >
            <defs>
              <marker
                id={marker}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10Z" fill="context-stroke" />
              </marker>
            </defs>
            <rect width="1000" height="1000" fill="#10131b" />
            <image
              href={radar}
              width="1000"
              height="1000"
              onLoad={() => setFailed(false)}
              onError={() => setFailed(true)}
            />
            {pad.objects
              .filter((o) => o.level === level && visibleAt(o, time, timed))
              .map((o) => {
                const a =
                    o.tool === "Joueur"
                      ? positionAt(o.keys, time)
                      : o.points[0],
                  b = o.points.at(-1)!;
                return (
                  <g
                    key={o.id}
                    data-item={o.id}
                    opacity={
                      selected && selected !== o.id?.toString() ? 0.85 : 1
                    }
                    style={{
                      cursor: tool === "Sélection" ? "move" : "crosshair",
                    }}
                  >
                    {o.tool === "Joueur" && o.keys.length > 1 && (
                      <polyline
                        points={o.keys.map((k) => k.x + "," + k.y).join(" ")}
                        fill="none"
                        stroke={o.color}
                        strokeWidth="2"
                        strokeDasharray="8 8"
                        opacity=".6"
                        pointerEvents="none"
                      />
                    )}
                    {["Flèche", "Ligne", "Dessin"].includes(o.tool) ? (
                      <polyline
                        points={o.points.map((p) => p.x + "," + p.y).join(" ")}
                        fill="none"
                        stroke={o.color}
                        strokeWidth={o.width}
                        strokeLinecap="round"
                        markerEnd={
                          o.tool === "Flèche"
                            ? "url(#" + marker + ")"
                            : undefined
                        }
                        pointerEvents="stroke"
                      />
                    ) : o.tool === "Rectangle" ? (
                      <rect
                        x={Math.min(a.x, b.x)}
                        y={Math.min(a.y, b.y)}
                        width={Math.abs(b.x - a.x)}
                        height={Math.abs(b.y - a.y)}
                        fill={o.color}
                        fillOpacity=".12"
                        stroke={o.color}
                        strokeWidth={o.width}
                      />
                    ) : o.tool === "Ellipse" ? (
                      <ellipse
                        cx={(a.x + b.x) / 2}
                        cy={(a.y + b.y) / 2}
                        rx={Math.abs(b.x - a.x) / 2}
                        ry={Math.abs(b.y - a.y) / 2}
                        fill={o.color}
                        fillOpacity=".12"
                        stroke={o.color}
                        strokeWidth={o.width}
                      />
                    ) : o.tool === "Texte" ? (
                      <text
                        x={a.x}
                        y={a.y}
                        fill={o.color}
                        fontSize="22"
                        stroke="#111"
                        strokeWidth=".5"
                      >
                        {o.label}
                      </text>
                    ) : (
                      <>
                        <circle
                          cx={a.x}
                          cy={a.y}
                          r={
                            o.tool === "Smoke"
                              ? 35
                              : o.tool === "Molotov"
                                ? 30
                                : 19
                          }
                          fill={o.color}
                          fillOpacity={o.tool === "Joueur" ? 1 : 0.65}
                          stroke={selected === o.id ? "#fff" : "#111"}
                          strokeWidth="3"
                        />
                        <text
                          x={a.x}
                          y={a.y + 6}
                          textAnchor="middle"
                          fill="#10131b"
                          fontSize="17"
                          fontWeight="bold"
                        >
                          {o.tool === "Joueur"
                            ? o.label
                            : o.tool === "Bombe"
                              ? "B"
                              : o.tool === "HE"
                                ? "HE"
                                : o.tool[0]}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
          </svg>
        </div>
        <aside className="stratpad-roster">
          <h4>Joueurs & étapes</h4>
          {pad.objects
            .filter((o) => o.tool === "Joueur")
            .map((o) => (
              <div key={o.id}>
                <button
                  className={selected === o.id ? "on" : ""}
                  onClick={() => {
                    setSelected(o.id);
                    setTool("Sélection");
                    setLevel(o.level);
                  }}
                >
                  {o.side} · {o.label}
                </button>
                <small>{o.keys.length} position(s)</small>
                {o.keys.map((k) => (
                  <button
                    className="stratpad-key"
                    key={k.time}
                    onClick={() => {
                      setTime(k.time);
                      setPlaying(false);
                      setLevel(o.level);
                    }}
                  >
                    {clock(k.time)}
                  </button>
                ))}
              </div>
            ))}
          {!pad.objects.some((o) => o.tool === "Joueur") && (
            <p>
              Choisissez Joueur, un camp et un numéro, puis cliquez sur la
              carte.
            </p>
          )}
          {picked && (
            <div className="stratpad-inspector">
              <h4>
                {picked.tool} · {picked.label}
              </h4>
              {picked.tool === "Joueur" && (
                <p>
                  À un autre timing, déplacez ce joueur pour ajouter une étape.
                </p>
              )}
              {editable && (
                <>
                  <button
                    disabled={busy || playing}
                    onClick={() => {
                      commit({
                        ...pad,
                        objects: pad.objects.filter((o) => o.id !== selected),
                      });
                      setSelected("");
                    }}
                  >
                    Supprimer l’objet
                  </button>
                  {picked.tool === "Joueur" && picked.keys.length > 1 && (
                    <button
                      disabled={
                        busy ||
                        playing ||
                        !picked.keys.some((k) => k.time === Math.round(time))
                      }
                      onClick={() =>
                        commit({
                          ...pad,
                          objects: pad.objects.map((o) =>
                            o.id === selected
                              ? {
                                  ...o,
                                  keys: o.keys.filter(
                                    (k) => k.time !== Math.round(time),
                                  ),
                                }
                              : o,
                          ),
                        })
                      }
                    >
                      Supprimer cette étape
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </aside>
      </div>
      {failed && <p role="alert">Radar indisponible pour cette map.</p>}
      <div className="stratpad-transport">
        <button
          onClick={() => {
            if (time <= 5) setTime(135);
            setPlaying(!playing);
          }}
        >
          {playing ? "Pause" : "Lire le round"}
        </button>
        <button
          onClick={() => {
            setTime(135);
            setPlaying(false);
          }}
        >
          Début
        </button>
        <strong>{clock(Math.round(time))}</strong>
        <input
          aria-label="Temps du stratpad"
          type="range"
          min="5"
          max="135"
          step="1"
          value={time}
          style={{ direction: "rtl" }}
          onChange={(e) => {
            setPlaying(false);
            setTime(+e.target.value);
          }}
        />
        <select
          aria-label="Vitesse de lecture"
          value={speed}
          onChange={(e) => setSpeed(+e.target.value)}
        >
          {[0.5, 1, 2, 4, 8].map((v) => (
            <option key={v} value={v}>
              {v}×
            </option>
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            checked={timed}
            onChange={(e) => setTimed(e.target.checked)}
          />
          Grenades temporisées
        </label>
      </div>
      <p className="fine">
        2:15 → 0:05. Déplacements interpolés entre vos étapes, sans calcul des
        collisions avec les murs. Smoke : 20 s, molotov : 7 s, autres grenades :
        repère de 2 s.
      </p>
      <div className="stratpad-actions">
        {editable && (
          <>
            <button disabled={!past.length || busy || playing} onClick={undo}>
              Annuler
            </button>
            <button disabled={!future.length || busy || playing} onClick={redo}>
              Rétablir
            </button>
            <button
              disabled={!pad.objects.length || busy || playing}
              onClick={() => {
                commit({ ...pad, objects: [] });
                setSelected("");
              }}
            >
              Vider le tableau
            </button>
            <button
              className="primary"
              disabled={busy || playing || !dirty}
              onClick={async () => {
                setBusy(true);
                try {
                  const ok = await save({
                    ...row,
                    updated_at: version.current,
                    data: { ...row.data, stratpad: pad },
                  });
                  if (ok) {
                    setDirty(false);
                    sessionStorage.removeItem(draftKey);
                    setMessage("Tableau enregistré avec la stratégie.");
                  } else
                    setMessage(
                      "Sauvegarde refusée. Votre brouillon est conservé.",
                    );
                } catch {
                  setMessage(
                    "Connexion interrompue. Votre brouillon est conservé.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Enregistrer le tableau
            </button>
          </>
        )}
        <button onClick={exportImage}>Exporter l’image SVG</button>
        <button
          onClick={() =>
            download(row.title + "-stratpad", { map: row.map, ...pad })
          }
        >
          Exporter le plan JSON
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
