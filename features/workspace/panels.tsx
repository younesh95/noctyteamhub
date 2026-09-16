"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Activity,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Crosshair,
  Download,
  FileVideo,
  Flag,
  Layers,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trash2,
  Users,
  X,
  Bell,
  Check,
  Play,
  Pause,
  ArrowUpRight,
  Save,
} from "lucide-react";
import {
  api,
  session,
  refreshSession,
  upload,
  fileUrl,
} from "../../lib/supabase";
import { Row, maps, clock, download } from "../../lib/domain/model";
export function safeUrl(url: string) {
  try {
    const u = new URL(url);
    return ["https:", "http:"].includes(u.protocol) ? u.href : "#";
  } catch {
    return "#";
  }
}
export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Layers size={30} />
      <p>{text}</p>
    </div>
  );
}
export function Strategy({
  row,
  players,
  dictionary,
  editable,
  save,
  edit,
}: {
  row: Row;
  players: any[];
  dictionary: Row[];
  editable: boolean;
  save: (r: Row) => Promise<boolean>;
  edit: () => void;
}) {
  const [tab, setTab] = useState("Timeline"),
    [player, setPlayer] = useState("Tous"),
    [spawn, setSpawn] = useState("Tous"),
    [time, setTime] = useState(115),
    [adding, setAdding] = useState(false),
    [actionError, setActionError] = useState(""),
    [actionBusy, setActionBusy] = useState(false);
  const actions = row.data.actions || [];
  const shown = actions.filter(
    (a: any) =>
      (player === "Tous" || a.player === player) &&
      (spawn === "Tous" || a.spawn === spawn),
  );
  return (
    <section className="strategy panel">
      <div className="strategy-head">
        <div>
          <span className="eyebrow">
            {row.map}{" "}
            <span className={"badge " + row.data.side}>{row.data.side}</span>{" "}
            <span className="badge">{row.data.buy}</span>
          </span>
          <h2>{row.title}</h2>
        </div>
        {editable && (
          <button
            className="icon"
            aria-label="Modifier la stratégie"
            onClick={edit}
          >
            <Settings size={18} />
          </button>
        )}
      </div>
      <p className="strategy-description">{row.body}</p>
      <div className="strategy-toolbar">
        <div className="underline-tabs">
          {["Timeline", "Tactical board"].map((t) => (
            <button
              className={tab === t ? "active" : ""}
              key={t}
              onClick={() => setTab(t)}
            >
              {t === "Timeline" ? <Activity size={16} /> : <Layers size={16} />}{" "}
              {t}
            </button>
          ))}
        </div>
        <button
          className="icon"
          aria-label="Exporter cette stratégie avec les filtres"
          onClick={() =>
            download("NOCTYS-" + row.title, {
              ...row,
              data: { ...row.data, actions: shown },
            })
          }
        >
          <Download size={17} />
        </button>
      </div>
      {tab === "Timeline" ? (
        <>
          <div className="timeline-controls">
            <span className="badge">{row.data.type}</span>
            <select
              aria-label="Filtrer par joueur"
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
            >
              <option value="Tous">Tous les joueurs</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.username}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrer par spawn"
              value={spawn}
              onChange={(e) => setSpawn(e.target.value)}
            >
              <option value="Tous">Tous les spawns</option>
              {[1, 2, 3, 4, 5].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="timeline-scroll">
            <div className="timeline">
              <div className="timeline-ruler">
                <span>JOUEUR</span>
                <div>
                  {[135, 115, 95, 75, 55, 35, 5].map((n) => (
                    <span key={n}>{clock(n)}</span>
                  ))}
                </div>
              </div>
              {players
                .filter(
                  (p) =>
                    ["joueur", "IGL"].includes(p.role) &&
                    (player === "Tous" || p.id === player),
                )
                .map((p, i) => (
                  <div className="timeline-track" key={p.id}>
                    <div className="track-name">
                      <span className={"player-dot color" + i}>{i + 1}</span>
                      <strong>{p.username}</strong>
                      <small>{p.role}</small>
                    </div>
                    <div className="track-content">
                      {shown
                        .filter((a: any) => a.player === p.id)
                        .map((a: any, j: number) => (
                          <div
                            key={j}
                            className={"action-block color" + i}
                            title={
                              clock(a.start) +
                              " → " +
                              clock(a.end) +
                              " · " +
                              a.text
                            }
                            style={{
                              left: ((135 - a.start) / 130) * 100 + "%",
                              width:
                                Math.max(3, ((a.start - a.end) / 130) * 100) +
                                "%",
                            }}
                          >
                            <span>{a.text}</span>
                          </div>
                        ))}
                      <div
                        className="playhead"
                        style={{ left: ((135 - time) / 130) * 100 + "%" }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="timeline-footer">
            <span className="clock">{clock(time)}</span>
            <input
              aria-label="Temps du round"
              type="range"
              min="5"
              max="135"
              value={time}
              onChange={(e) => setTime(+e.target.value)}
              style={{ direction: "rtl" }}
            />
            <span className="fine">2:15 → 0:05</span>
          </div>
          <div className="action-heading">
            <h3>
              Actions du round <span className="muted">{shown.length}</span>
            </h3>
            {editable && (
              <button onClick={() => setAdding(!adding)}>
                <Plus size={15} /> Action
              </button>
            )}
          </div>
          {adding && (
            <form
              className="action-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                const a = { ...f, start: +f.start, end: +f.end };
                if (a.end > a.start) {
                  setActionError(
                    "La fin doit être inférieure ou égale au début sur une horloge décroissante.",
                  );
                  return;
                }
                setActionError("");
                setActionBusy(true);
                try {
                  if (
                    await save({
                      ...row,
                      data: { ...row.data, actions: [...actions, a] },
                    })
                  )
                    setAdding(false);
                } finally {
                  setActionBusy(false);
                }
              }}
            >
              <div className="two">
                <label>
                  Joueur
                  <select name="player" required>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.username}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Spawn
                  <select name="spawn">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Action
                <input
                  name="text"
                  required
                  list="dictionary"
                  placeholder="Écrire ou choisir un mot du dictionnaire"
                />
                <datalist id="dictionary">
                  {dictionary.map((d) => (
                    <option key={d.id}>{d.title}</option>
                  ))}
                </datalist>
              </label>
              <div className="two">
                <label>
                  Début (secondes restantes)
                  <input
                    name="start"
                    type="number"
                    required
                    min="5"
                    max="135"
                    defaultValue="115"
                  />
                </label>
                <label>
                  Fin ≤ début (instant : même valeur)
                  <input
                    name="end"
                    type="number"
                    required
                    min="5"
                    max="135"
                    defaultValue="100"
                  />
                </label>
              </div>
              {actionError && (
                <p className="notice" role="alert">
                  {actionError}
                </p>
              )}
              <button className="primary" disabled={actionBusy}>
                {actionBusy ? "Enregistrement…" : "Ajouter à la timeline"}
              </button>
            </form>
          )}
          <div className="action-list">
            {shown.map((a: any, i: number) => (
              <div className="action-line" key={i}>
                <span className="clock">
                  {clock(a.start)}
                  {a.end !== a.start ? " – " + clock(a.end) : ""}
                </span>
                <span className="action-player">
                  {players.find((p) => p.id === a.player)?.username || "Joueur"}
                </span>
                <span>{a.text}</span>
                {editable && (
                  <button
                    className="icon"
                    aria-label="Supprimer cette action"
                    onClick={() =>
                      save({
                        ...row,
                        data: {
                          ...row.data,
                          actions: actions.filter((x: any) => x !== a),
                        },
                      })
                    }
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <Board
          points={row.data.points || []}
          editable={editable}
          onChange={(points) => save({ ...row, data: { ...row.data, points } })}
        />
      )}
    </section>
  );
}
export function Board({
  points,
  editable,
  onChange,
}: {
  points: any[];
  editable: boolean;
  onChange: (p: any[]) => void;
}) {
  const [tool, setTool] = useState("1");
  return (
    <div className="board-wrap">
      <div className="row">
        <p className="fine">
          Plan schématique · cliquez pour placer un repère. Fond radar non
          intégré.
        </p>
        {editable && (
          <button onClick={() => onChange(points.slice(0, -1))}>
            Annuler le dernier
          </button>
        )}
      </div>
      <div className="board-tools">
        {["1", "2", "3", "4", "5", "Smoke", "Flash", "Molotov"].map((t) => (
          <button
            key={t}
            className={tool === t ? "on" : ""}
            onClick={() => setTool(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div
        className="board"
        role="application"
        aria-label="Tableau tactique schématique"
        onClick={(e) => {
          if (!editable) return;
          const r = e.currentTarget.getBoundingClientRect();
          onChange([
            ...points,
            {
              x: ((e.clientX - r.left) / r.width) * 100,
              y: ((e.clientY - r.top) / r.height) * 100,
              label: tool,
            },
          ]);
        }}
      >
        <span className="zone a">SITE A</span>
        <span className="zone b">SITE B</span>
        <span className="zone mid">MID</span>
        {points.map((p, i) => (
          <button
            key={i}
            className="board-point"
            style={{ left: p.x + "%", top: p.y + "%" }}
            title="Supprimer ce repère"
            onClick={(e) => {
              e.stopPropagation();
              if (editable) onChange(points.filter((_, j) => j !== i));
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
export function Roles({
  rows,
  players,
  save,
  editable,
}: {
  rows: Row[];
  players: any[];
  save: (r: Row) => void;
  editable: boolean;
}) {
  const ps = players.filter((p) => ["joueur", "IGL"].includes(p.role));
  return (
    <div className="roles">
      {maps.map((map) => {
        const r = rows.find((r) => r.kind === "roles" && r.map === map) || {
          id: crypto.randomUUID(),
          kind: "roles",
          title: map,
          body: "",
          map,
          data: {},
        };
        return (
          <div className="panel" key={map}>
            <h3>{map}</h3>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>SIDE</th>
                    {ps.map((p) => (
                      <th key={p.id}>{p.username}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["T", "CT"].map((side) => (
                    <tr key={side}>
                      <th>
                        <span className={"badge " + side}>{side}</span>
                      </th>
                      {ps.map((p) => (
                        <td key={p.id}>
                          <select
                            aria-label={map + " " + side + " " + p.username}
                            disabled={!editable}
                            value={r.data[side]?.[p.id] || ""}
                            onChange={(e) =>
                              save({
                                ...r,
                                data: {
                                  ...r.data,
                                  [side]: {
                                    ...r.data[side],
                                    [p.id]: e.target.value,
                                  },
                                },
                              })
                            }
                          >
                            <option value="">À attribuer</option>
                            {(side === "T"
                              ? [
                                  "Entry",
                                  "Support",
                                  "Lurker",
                                  "AWP",
                                  "IGL",
                                  "Trader",
                                ]
                              : [
                                  "B",
                                  "AWP fixe",
                                  "A fixe",
                                  "Mid player",
                                  "Anchor",
                                  "B rotation",
                                  "A rotation",
                                ]
                            ).map((role) => (
                              <option
                                key={role}
                                disabled={Object.entries(
                                  r.data[side] || {},
                                ).some(([id, v]) => id !== p.id && v === role)}
                              >
                                {role}
                              </option>
                            ))}
                          </select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function Schedule({
  rows,
  me,
  personal,
  week,
  setWeek,
  edit,
  canEdit,
}: {
  rows: Row[];
  me: any;
  personal: boolean;
  week: number;
  setWeek: (v: number) => void;
  edit: (r: Row) => void;
  canEdit: boolean;
}) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + week * 7);
  const events = rows.filter(
    (r) =>
      r.kind === "event" &&
      (r.scope !== "personal" || (personal && r.owner_id === me?.id)),
  );
  return (
    <>
      <div className="calendar-toolbar">
        <button
          onClick={() => setWeek(week - 1)}
          aria-label="Semaine précédente"
        >
          <ChevronLeft size={17} />
        </button>
        <h3>
          Semaine du{" "}
          {start.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </h3>
        <button onClick={() => setWeek(week + 1)} aria-label="Semaine suivante">
          <ChevronRight size={17} />
        </button>
        <button onClick={() => setWeek(0)}>Aujourd’hui</button>
      </div>
      <div className="calendar">
        {Array.from({ length: 7 }, (_, i) => {
          const day = new Date(start);
          day.setDate(day.getDate() + i);
          return (
            <div className="calendar-day" key={i}>
              <header>
                <span>
                  {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                </span>
                <strong>{day.getDate()}</strong>
              </header>
              {events
                .filter(
                  (r) =>
                    new Date(r.data.start).toDateString() ===
                    day.toDateString(),
                )
                .sort((a, b) => a.data.start.localeCompare(b.data.start))
                .map((r) => (
                  <button
                    className="event"
                    key={r.id}
                    onClick={() => {
                      if (
                        (r.scope === "personal" && r.owner_id === me?.id) ||
                        canEdit
                      )
                        edit(r);
                    }}
                  >
                    <small>
                      {new Date(r.data.start).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {new Date(r.data.end).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                    <strong>{r.title}</strong>
                    <span>
                      {r.data.eventType} · {r.data.bo}
                    </span>
                    <span>{r.map || r.data.maps}</span>
                    {r.scope !== "personal" && (
                      <span className="badge">Équipe</span>
                    )}
                  </button>
                ))}
            </div>
          );
        })}
      </div>
      <div className="notice">
        {personal
          ? "Les événements de l’équipe apparaissent aussi dans votre calendrier personnel."
          : "Le coach, l’analyste et l’IGL peuvent créer les événements collectifs."}{" "}
        Import FACEIT / PRACC non configuré ; ajout manuel disponible.
      </div>
    </>
  );
}
export function Chat({
  rows,
  players,
  me,
  personal,
  recipient,
  setRecipient,
  save,
}: {
  rows: Row[];
  players: any[];
  me: any;
  personal: boolean;
  recipient: string;
  setRecipient: (v: string) => void;
  save: (r: Row) => Promise<boolean>;
}) {
  const [body, setBody] = useState("");
  const messages = rows
    .filter(
      (r) =>
        r.kind === "chat" &&
        (personal
          ? r.scope === "personal" &&
            ((r.owner_id === me?.id && r.recipient_id === recipient) ||
              (r.owner_id === recipient && r.recipient_id === me?.id))
          : r.scope !== "personal"),
    )
    .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
  return (
    <div className="panel chat">
      <header>
        <MessageSquare size={20} />
        <h3>{personal ? "Conversation privée" : "# équipe-noctys"}</h3>
        {personal && (
          <select
            aria-label="Destinataire"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          >
            <option value="">Choisir un coéquipier</option>
            {players
              .filter((p) => p.id !== me?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.username}
                </option>
              ))}
          </select>
        )}
      </header>
      <div className="messages">
        {messages.map((m) => (
          <div
            key={m.id}
            className={"message " + (m.owner_id === me?.id ? "mine" : "")}
          >
            <strong>
              {players.find((p) => p.id === m.owner_id)?.username ||
                me?.username}
            </strong>
            <p>{m.body}</p>
            <small>
              {m.created_at
                ? new Date(m.created_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "À l’instant"}
            </small>
          </div>
        ))}
        {!messages.length && (
          <Empty
            text={
              personal && !recipient
                ? "Choisissez un coéquipier pour commencer."
                : "Le premier message donne le ton."
            }
          />
        )}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!body.trim()) return;
          try {
            const ok = await save({
              id: crypto.randomUUID(),
              kind: "chat",
              title: "Message",
              body: body.trim(),
              owner_id: me?.id,
              scope: personal ? "personal" : "team",
              ...(personal ? { recipient_id: recipient } : {}),
              data: {},
              created_at: new Date().toISOString(),
            });
            if (ok) setBody("");
          } catch {}
        }}
      >
        <input
          aria-label="Votre message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Écrire un message…"
          required
          maxLength={5000}
        />
        <button className="primary" disabled={personal && !recipient}>
          Envoyer <ArrowUpRight size={17} />
        </button>
      </form>
    </div>
  );
}
export function Routine({ save, me }: { save: (r: Row) => void; me: any }) {
  const [minutes, setMinutes] = useState(30),
    [focus, setFocus] = useState("Précision"),
    [date, setDate] = useState(""),
    [generated, setGenerated] = useState(false);
  const parts = [
    {
      name: "Échauffement",
      ratio: 0.2,
      body: "Tracking lent et mouvements contrôlés. Priorité à la fluidité.",
    },
    {
      name: focus,
      ratio: 0.5,
      body:
        focus === "Précision"
          ? "Tirs uniques, contre-strafe puis vérification de l’arrêt avant chaque tir."
          : focus === "Tracking"
            ? "Suivre une cible mobile sans tirer, puis ajouter de courtes rafales."
            : "Sorties d’angle, arrêt net et premier tir à hauteur de tête.",
    },
    {
      name: "Deathmatch ciblé",
      ratio: 0.3,
      body: "Appliquer le travail en duel. Terminer par une note sur les erreurs récurrentes.",
    },
  ];
  return (
    <div className="two routine">
      <section className="panel">
        <Crosshair size={30} />
        <h2>Votre prochaine session.</h2>
        <p className="muted">
          Routine guidée à partir de votre objectif et du temps disponible.
        </p>
        <label>
          Temps disponible : {minutes} minutes
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={minutes}
            onChange={(e) => {
              setMinutes(+e.target.value);
              setGenerated(false);
            }}
          />
        </label>
        <label>
          Axe à travailler
          <select
            value={focus}
            onChange={(e) => {
              setFocus(e.target.value);
              setGenerated(false);
            }}
          >
            <option>Précision</option>
            <option>Tracking</option>
            <option>Premier tir</option>
          </select>
        </label>
        <button className="primary" onClick={() => setGenerated(true)}>
          Construire la routine <ChevronRight size={17} />
        </button>
        <p className="fine">
          Programme déterministe. L’analyse IA des statistiques n’est pas encore
          connectée.
        </p>
      </section>
      <section className="panel">
        {generated ? (
          <>
            <span className="eyebrow">
              {minutes} MINUTES · {focus.toUpperCase()}
            </span>
            <h2>Du geste au duel.</h2>
            {parts.map((p, i) => (
              <div className="routine-step" key={p.name}>
                <span>0{i + 1}</span>
                <div>
                  <h3>
                    {p.name}{" "}
                    <small>
                      {i === 2
                        ? minutes -
                          Math.round(minutes * 0.2) -
                          Math.round(minutes * 0.5)
                        : Math.round(minutes * p.ratio)}{" "}
                      min
                    </small>
                  </h3>
                  <p>{p.body}</p>
                </div>
              </div>
            ))}
            <label>
              Planifier ma session
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <button
              className="primary"
              disabled={!date}
              onClick={() =>
                save({
                  id: crypto.randomUUID(),
                  kind: "event",
                  title: "Aim · " + focus,
                  body: parts.map((p) => p.name + ": " + p.body).join("\n"),
                  scope: "personal",
                  owner_id: me?.id,
                  data: {
                    start: new Date(date).toISOString(),
                    end: new Date(
                      new Date(date).getTime() + minutes * 60000,
                    ).toISOString(),
                    eventType: "Aim routine",
                  },
                })
              }
            >
              <CalendarDays size={16} /> Ajouter au planning personnel
            </button>
          </>
        ) : (
          <Empty text="Choisissez un objectif pour préparer votre routine." />
        )}
      </section>
    </div>
  );
}
export function Nades() {
  const [map, setMap] = useState("Mirage"),
    [type, setType] = useState("Smoke"),
    [query, setQuery] = useState("");
  return (
    <section className="panel nades">
      <Target size={36} />
      <span className="eyebrow">UTILITY LAB</span>
      <h2>
        La bonne grenade.
        <br />
        Au bon moment.
      </h2>
      <div className="two">
        <label>
          Map
          <select value={map} onChange={(e) => setMap(e.target.value)}>
            {maps.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          Utilitaire
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {["Smoke", "Flash", "Molotov", "HE"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Position ou objectif
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex. window, retake B, pop flash…"
        />
      </label>
      <div className="row">
        <a
          className="link-button primary"
          href={
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent("CS2 " + map + " " + type + " " + query)
          }
          target="_blank"
          rel="noreferrer"
        >
          Chercher sur YouTube <ArrowUpRight size={16} />
        </a>
        <a
          className="link-button"
          href="https://csnades.gg/"
          target="_blank"
          rel="noreferrer"
        >
          Ouvrir CSNADES.gg <ArrowUpRight size={16} />
        </a>
      </div>
      <p className="fine">Les ressources s’ouvrent sur leur site d’origine.</p>
    </section>
  );
}
export function Notes({
  row,
  players,
  save,
  editable,
}: {
  row: Row;
  players: any[];
  save: (r: Row) => Promise<boolean>;
  editable: boolean;
}) {
  const [pending, setPending] = useState(false);
  return (
    <div className="notes">
      <h3>Notes de review</h3>
      {(row.data.notes || []).map((n: any, i: number) => (
        <p key={i}>
          <span className="badge">
            R{n.round} · {n.time}
          </span>{" "}
          @{players.find((p) => p.id === n.player)?.username} — {n.text}
        </p>
      ))}
      {editable && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = Object.fromEntries(new FormData(form));
            setPending(true);
            try {
              if (
                await save({
                  ...row,
                  data: { ...row.data, notes: [...(row.data.notes || []), f] },
                })
              )
                form.reset();
            } finally {
              setPending(false);
            }
          }}
        >
          <div className="two">
            <label>
              Round
              <input
                name="round"
                type="number"
                min="1"
                max="200"
                required
                defaultValue="1"
              />
            </label>
            <label>
              Temps
              <input
                name="time"
                placeholder="1:20"
                pattern="[0-2]:[0-5][0-9]"
                required
              />
            </label>
          </div>
          <label>
            Joueur
            <select name="player">
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.username}
                </option>
              ))}
            </select>
          </label>
          <label>
            Remarque
            <textarea name="text" required />
          </label>
          <button disabled={pending}>
            {pending ? "Enregistrement…" : "Ajouter une note"}
          </button>
        </form>
      )}
    </div>
  );
}
export function RecordForm({
  view,
  group,
  row,
  players,
  opponents,
  busy,
  submit,
}: {
  view: string;
  group: string;
  row: Row | null;
  players: any[];
  opponents: Row[];
  busy: boolean;
  submit: (f: any, file: File | null) => void;
}) {
  const d = row?.data || {};
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget));
        const file = f.file as File;
        delete f.file;
        submit(f, file?.size ? file : null);
      }}
    >
      <label>
        {view === "Dictionary"
          ? "Mot ou expression"
          : view === "Opponents"
            ? "Nom de l’équipe"
            : "Nom"}
        <input
          name="title"
          required
          maxLength={150}
          defaultValue={row?.title}
        />
      </label>
      <label>
        {view === "Dictionary" ? "Définition" : "Description / remarques"}
        <textarea name="body" defaultValue={row?.body} />
      </label>
      {view !== "Dictionary" && (
        <label>
          Map
          <select
            name="map"
            required={view === "Stratbook builder"}
            defaultValue={row?.map || ""}
          >
            <option value="">Général</option>
            {maps.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      )}
      {view === "Stratbook builder" && (
        <>
          <div className="two">
            <label>
              Side
              <select name="side" defaultValue={d.side || "T"}>
                <option>T</option>
                <option>CT</option>
              </select>
            </label>
            <label>
              Type de round
              <select name="buy" defaultValue={d.buy || "Full buy"}>
                {["Eco buy", "Pistol", "Force buy", "Full buy"].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Organisation
            <select name="type" defaultValue={d.type || "Selon les rôles"}>
              <option>Selon les rôles</option>
              <option>Selon les spawns</option>
            </select>
          </label>
        </>
      )}
      {view === "Anti strat" && (
        <label>
          Adversaire
          <select name="opponent" required defaultValue={d.opponent}>
            <option value="">Choisir un adversaire</option>
            {opponents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {view.includes("schedule") && (
        <>
          <div className="two">
            <label>
              Début
              <input
                name="start"
                type="datetime-local"
                required
                defaultValue={localDate(d.start)}
              />
            </label>
            <label>
              Fin
              <input
                name="end"
                type="datetime-local"
                required
                defaultValue={localDate(d.end)}
              />
            </label>
          </div>
          <div className="two">
            <label>
              Type
              <select name="eventType" defaultValue={d.eventType}>
                {[
                  "Entraînement",
                  "Match",
                  "Pracc",
                  "Atelier",
                  "Review",
                  "Personnel",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Format
              <select name="bo" defaultValue={d.bo}>
                {["—", "BO1", "BO3", "BO5"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Adversaire
            <input name="opponentName" defaultValue={d.opponentName} />
          </label>
          <label>
            Maps (séparées par des virgules)
            <input name="maps" defaultValue={d.maps} />
          </label>
        </>
      )}
      {view === "Teamplay improver" && (
        <>
          <label>
            Nombre de joueurs
            <input
              name="players"
              type="number"
              min="2"
              max="5"
              defaultValue={d.players || 2}
              required
            />
          </label>
          <label>
            But et intérêt
            <textarea name="goal" defaultValue={d.goal} required />
          </label>
        </>
      )}
      {(view === "GameSense upgrader" ||
        (group === "micro" && view === "Tips & tricks")) && (
        <label>
          Destiné au joueur
          <select name="tag" defaultValue={d.tag}>
            <option value="">Tous les joueurs</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.username}
              </option>
            ))}
          </select>
        </label>
      )}
      {!["Stratbook builder", "Team schedule", "Personnel schedule"].includes(
        view,
      ) && (
        <>
          <label>
            {view === "Opponents"
              ? "Lien de l’équipe FACEIT"
              : "Lien vidéo ou ressource"}
            <input
              name="url"
              type="url"
              pattern={
                view === "Opponents" ? "https://www.faceit.com/.*" : undefined
              }
              defaultValue={d.url}
              required={view === "Opponents"}
              placeholder="https://…"
            />
          </label>
          <label>
            {view.includes("Demo")
              ? "Fichier démo (.dem)"
              : "Image ou pièce jointe"}
            <input
              name="file"
              type="file"
              accept={
                view.includes("Demo")
                  ? ".dem"
                  : "image/png,image/jpeg,image/webp,video/mp4,application/pdf"
              }
            />
          </label>
        </>
      )}
      <button className="primary wide" disabled={busy}>
        {busy ? "Enregistrement…" : "Enregistrer"}
        <Save size={17} />
      </button>
    </form>
  );
}
export function localDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function Profile({
  me,
  demo,
  done,
  error,
}: {
  me: any;
  demo: boolean;
  done: (p: any) => void;
  error: (s: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = Object.fromEntries(new FormData(e.currentTarget));
        try {
          const p = {
            steam_id: f.steam_id,
            info: f.info,
            faceit: f.faceit,
            avatar: me?.avatar || null,
          };
          const file = f.photo as File;
          if (file.size) {
            if (demo) throw new Error("Connectez-vous pour ajouter une photo.");
            if (file.size > 5 * 1024 * 1024)
              throw new Error("Photo limitée à 5 Mo.");
            p.avatar = await upload(file, me.id);
          }
          if (!demo)
            await api("/rest/v1/profiles?id=eq." + me.id, {
              method: "PATCH",
              body: JSON.stringify(p),
            });
          done({ ...me, ...p });
        } catch (e) {
          error((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Photo de profil
        <input
          name="photo"
          type="file"
          accept="image/png,image/jpeg,image/webp"
        />
      </label>
      <label>
        Steam ID
        <input
          name="steam_id"
          pattern="[0-9]{17}"
          placeholder="7656119…"
          defaultValue={me?.steam_id}
        />
      </label>
      <label>
        Pseudo FACEIT
        <input name="faceit" defaultValue={me?.faceit} />
      </label>
      <label>
        Informations
        <textarea
          name="info"
          defaultValue={me?.info}
          placeholder="Rôles préférés, objectifs, disponibilités…"
        />
      </label>
      <button className="primary" disabled={busy}>
        Enregistrer le profil
      </button>
    </form>
  );
}
