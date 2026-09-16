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
import {
  Row,
  maps,
  clock,
  download,
  normalizeMap,
} from "../../lib/domain/model";
import {
  safeUrl,
  Empty,
  Strategy,
  Board,
  Roles,
  Schedule,
  Chat,
  Routine,
  Nades,
  Notes,
  RecordForm,
  Profile,
} from "../../features/workspace/panels";
import TacticalBoard from "../../features/tactical/TacticalBoard";
import FaceitPanel from "../../features/faceit/Panel";
import FaceitSettings from "../../features/faceit/Settings";
import DemoLibrary from "../../features/demos/DemoLibrary";
import Members from "../../features/team/Members";
const macro = [
  ["Stratbook builder", BookOpen],
  ["Tactical board", Crosshair],
  ["Player roles", Users],
  ["Demo analyzer", FileVideo],
  ["Opponents", Shield],
  ["Anti strat", Swords],
  ["Team chat", MessageSquare],
  ["Team schedule", CalendarDays],
  ["Tips & tricks", Sparkles],
  ["Teamplay improver", Layers],
  ["Dictionary", BookOpen],
] as const;
const micro = [
  ["Stats", Activity],
  ["Personnel schedule", CalendarDays],
  ["Demo analyze", FileVideo],
  ["Aim routine", Crosshair],
  ["Nade King", Target],
  ["GameSense upgrader", Layers],
  ["Tips & tricks", Sparkles],
  ["Personnel chat", MessageSquare],
] as const;
const demoPlayers = [
  "Joueur 1",
  "Joueur 2",
  "Joueur 3",
  "Joueur 4",
  "Joueur 5",
].map((username, i) => ({
  id: "p" + i,
  username,
  role: i === 4 ? "IGL" : "joueur",
}));
const seed: Row[] = [
  {
    id: "s1",
    kind: "strat",
    title: "Prise de contrôle mid → Split A",
    body: "Prendre le mid à trois, isoler connector puis synchroniser la sortie palace et rampe. Attendre la flash de soutien avant le contact.",
    map: "Mirage",
    data: {
      side: "T",
      buy: "Full buy",
      type: "Selon les rôles",
      actions: [
        {
          player: "p0",
          spawn: "1",
          start: 115,
          end: 100,
          text: "Prise de contrôle top mid",
        },
        {
          player: "p1",
          spawn: "2",
          start: 112,
          end: 105,
          text: "Smoke window • flash mid",
        },
        {
          player: "p2",
          spawn: "3",
          start: 95,
          end: 85,
          text: "Sortie palace sur flash",
        },
        {
          player: "p3",
          spawn: "4",
          start: 115,
          end: 95,
          text: "Tenir le push B apps",
        },
        {
          player: "p4",
          spawn: "5",
          start: 95,
          end: 80,
          text: "Split connector → A",
        },
      ],
      points: [],
    },
  },
  {
    id: "s2",
    kind: "strat",
    title: "Contact B • explosion tardive",
    body: "Conserver les utilitaires et progresser sans bruit avant le signal IGL.",
    map: "Mirage",
    data: {
      side: "T",
      buy: "Force buy",
      type: "Selon les spawns",
      actions: [],
      points: [],
    },
  },
  {
    id: "s3",
    kind: "strat",
    title: "Default CT • contrôle banana",
    body: "Duo banana, flash de soutien et repli après le premier contact.",
    map: "Inferno",
    data: {
      side: "CT",
      buy: "Full buy",
      type: "Selon les rôles",
      actions: [],
      points: [],
    },
  },
  {
    id: "d1",
    kind: "dictionary",
    title: "Trade",
    body: "Éliminer rapidement l’adversaire qui vient de tuer un coéquipier. Maintenir une distance permettant l’échange.",
    data: {},
  },
  {
    id: "d2",
    kind: "dictionary",
    title: "Contact",
    body: "Progresser sans révéler sa présence, puis accélérer au premier contact ennemi.",
    data: {},
  },
  {
    id: "t1",
    kind: "macro-tips",
    title: "Le tempo d’un round",
    body: "Début : recueillir les informations et prendre de l’espace. Milieu : identifier les rotations. Fin : synchroniser les utilitaires, entrer et préparer le post-plant.",
    data: {},
  },
  {
    id: "m1",
    kind: "moves",
    title: "Flash & peek",
    body: "Le support annonce sa flash. L’entry sort au moment où elle explose, puis le support se positionne pour trade.",
    map: "Mirage",
    data: {
      players: "2",
      goal: "Créer un duel favorable tout en conservant une possibilité de trade.",
    },
  },
];
const kindFor = (view: string, group: string) =>
  ({
    "Stratbook builder": "strat",
    Opponents: "opponent",
    "Anti strat": "anti",
    Dictionary: "dictionary",
    "Teamplay improver": "moves",
    "GameSense upgrader": "gamesense",
    "Tips & tricks": group + "-tips",
    "Demo analyzer": "demo",
    "Demo analyze": "personal-demo",
  })[view] || view;
export default function Workspace() {
  const [demo, setDemo] = useState(false),
    [loaded, setLoaded] = useState(false),
    [group, setGroup] = useState("macro"),
    [view, setView] = useState("Stratbook builder"),
    [rows, setRows] = useState<Row[]>([]),
    [players, setPlayers] = useState<any[]>([]),
    [me, setMe] = useState<any>(null),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [selected, setSelected] = useState("s1"),
    [query, setQuery] = useState(""),
    [map, setMap] = useState("Toutes les maps"),
    [side, setSide] = useState("Tous"),
    [modal, setModal] = useState<string | null>(null),
    [editing, setEditing] = useState<Row | null>(null),
    [mobile, setMobile] = useState(false),
    [busy, setBusy] = useState(false),
    [notifications, setNotifications] = useState<Row[]>([]),
    [recipient, setRecipient] = useState(""),
    [week, setWeek] = useState(0);
  const seen = useRef<Set<string>>(new Set());
  const staff = demo || ["coach", "analyste"].includes(me?.role),
    scheduleRights = staff || me?.role === "IGL";
  useEffect(() => {
    let alive = true;
    async function init() {
      const d = new URLSearchParams(location.search).get("demo") === "1";
      setDemo(d);
      if (d) {
        setRows(seed);
        setPlayers(demoPlayers);
        setMe({ id: "coach", username: "Coach NOCTYS", role: "coach" });
        setLoaded(true);
        return;
      }
      const s = await refreshSession();
      if (!s) {
        location.href = "/";
        return;
      }
      try {
        const p = await api(
          "/rest/v1/profiles?id=eq." + s.user.id + "&select=*",
        );
        if (!alive) return;
        setMe(p[0]);
        if (!p[0]?.active) {
          setError(
            "Votre accès à l’équipe doit être validé par le staff NOCTYS.",
          );
          setLoaded(true);
          return;
        }
        const [r, ps] = await Promise.all([
          api("/rest/v1/records?select=*&order=created_at.desc"),
          api(
            "/rest/v1/profiles?active=eq.true&select=id,username,role,steam_id,info,avatar,faceit",
          ),
        ]);
        setRows(r.map((x: Row) => ({ ...x, map: normalizeMap(x.map) })));
        setPlayers(ps);
        seen.current = new Set(r.map((x: Row) => x.id));
        if (!p[0].info && !p[0].steam_id) setModal("Profil");
      } catch (e) {
        setError("Supabase : " + (e as Error).message);
      }
      setLoaded(true);
    }
    init();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (demo || !me?.active) return;
    const token = session()?.access_token;
    if (!token) return;
    const ws = new WebSocket(
      "wss://adrleyvcufedeologxnx.supabase.co/realtime/v1/websocket?apikey=sb_publishable_QUi-yYaY9X3etHap3wfx9Q_BTdOt0Ty&vsn=1.0.0",
    );
    let ref = 1;
    ws.onopen = () =>
      ws.send(
        JSON.stringify({
          topic: "realtime:noctys",
          event: "phx_join",
          payload: {
            config: {
              postgres_changes: [
                { event: "*", schema: "public", table: "records" },
              ],
            },
            access_token: token,
          },
          ref: String(ref++),
        }),
      );
    ws.onmessage = async (ev) => {
      const m = JSON.parse(ev.data);
      if (m.event === "postgres_changes") {
        try {
          await refreshSession();
          const r = await api(
            "/rest/v1/records?select=*&order=created_at.desc",
          );
          setRows(r.map((x: Row) => ({ ...x, map: normalizeMap(x.map) })));
          const fresh = r.filter(
            (x: Row) =>
              x.kind === "chat" &&
              !seen.current.has(x.id) &&
              x.owner_id !== me.id,
          );
          if (fresh.length) setNotifications((n) => [...fresh, ...n]);
          seen.current = new Set(r.map((x: Row) => x.id));
        } catch {
          setError("Synchronisation interrompue. Rechargez la page.");
        }
      }
    };
    const timer = setInterval(() => {
      if (ws.readyState === 1)
        ws.send(
          JSON.stringify({
            topic: "phoenix",
            event: "heartbeat",
            payload: {},
            ref: String(ref++),
          }),
        );
    }, 25000);
    return () => {
      clearInterval(timer);
      ws.close();
    };
  }, [demo, me]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector(".modal");
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
        ) || [],
      );
    focusable()[0]?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModal(null);
        setEditing(null);
      }
      if (e.key === "Tab") {
        const list = focusable(),
          first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [modal]);
  function navigate(v: string, g = group) {
    setError("");
    setView(v);
    setGroup(g);
    setQuery("");
    setMap("Toutes les maps");
    setSide("Tous");
    setMobile(false);
  }
  async function persist(row: Row) {
    setError("");
    if (demo) {
      setRows((r) => [row, ...r.filter((x) => x.id !== row.id)]);
      setToast("Modification de démonstration • non sauvegardée");
      return;
    }
    if (!me?.active) throw new Error("Accès non validé.");
    await refreshSession();
    const old = rows.some((r) => r.id === row.id);
    const data = { ...row, owner_id: row.owner_id || me.id };
    const r = await api("/rest/v1/records" + (old ? "?id=eq." + row.id : ""), {
      method: old ? "PATCH" : "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    setRows((xs) => [r[0], ...xs.filter((x) => x.id !== row.id)]);
    setToast("Enregistré dans Supabase");
  }
  async function save(row: Row) {
    try {
      await persist(row);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  async function remove(row: Row) {
    try {
      if (!demo)
        await api("/rest/v1/records?id=eq." + row.id, { method: "DELETE" });
      setRows((r) => r.filter((x) => x.id !== row.id));
      setToast(
        demo ? "Exemple supprimé pour cette session" : "Élément supprimé",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const kind = kindFor(view, group),
    filtered = rows.filter(
      (r) =>
        r.kind === kind &&
        (map === "Toutes les maps" || r.map === map) &&
        (side === "Tous" || r.data.side === side) &&
        (r.title + " " + r.body).toLowerCase().includes(query.toLowerCase()),
    );
  const strat = filtered.find((r) => r.id === selected) || filtered[0];
  function create() {
    setError("");
    setEditing(null);
    setModal(view);
  }
  const personal = [
    "Personnel schedule",
    "Personnel chat",
    "Demo analyze",
  ].includes(view);
  const editable = staff || personal;
  const items = group === "macro" ? macro : micro;
  if (!loaded)
    return (
      <div className="loading">
        <img src="/noctys.png" alt="NOCTYS" />
        <p>Connexion à votre espace…</p>
      </div>
    );
  return (
    <div className="shell">
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <a className="brand" href="/">
          <img src="/noctys.png" alt="" />
          <span>
            NOCTYS<small>TEAM HEADQUARTERS</small>
          </span>
        </a>
        <div className="team-select">
          <span className="mini-logo">N</span>
          <div>
            <strong>NOCTYS E-sports</strong>
            <small>Counter-Strike 2</small>
          </div>
          <ChevronsUpDown size={15} />
        </div>
        <div className="mode-switch">
          <button
            className={group === "macro" ? "on" : ""}
            onClick={() => navigate("Stratbook builder", "macro")}
          >
            <Users size={15} /> Macro
          </button>
          <button
            className={group === "micro" ? "on" : ""}
            onClick={() => navigate("Stats", "micro")}
          >
            <Crosshair size={15} /> Micro
          </button>
        </div>
        <p className="nav-label">
          {group === "macro" ? "ESPACE ÉQUIPE" : "ESPACE PERSONNEL"}
        </p>
        <nav>
          {items.map(([label, Icon]) => (
            <button
              key={label}
              className={view === label ? "active" : ""}
              onClick={() => navigate(label)}
            >
              <Icon size={18} />
              {label}
              {view === label && <span className="nav-mark" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {staff && (
            <button className="members-trigger" onClick={() => setModal("Membres")}>
              <Users size={17} /> Gérer les membres
            </button>
          )}
          <a
            className="faceit"
            href="https://www.faceit.com/fr/teams/55a41dee-2ee2-4b0e-ba54-40222cd45ec5/leagues"
            target="_blank"
            rel="noreferrer"
          >
            Équipe sur FACEIT <ArrowUpRight size={16} />
          </a>
          <button onClick={() => setModal("Profil")}>
            <span className="avatar">
              {(me?.username || "N").slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{me?.username || "Mon profil"}</strong>
              <small>{me?.role || "En attente"}</small>
            </div>
            <Settings size={16} />
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <button
              className="mobile-toggle"
              aria-label="Ouvrir le menu"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <span className="muted">
              {group === "macro" ? "Macro gameplay" : "Micro gameplay"}
            </span>
            <ChevronRight size={14} />
            <span>{view}</span>
          </div>
          <div>
            <FaceitSettings />
            <span className="status-pill">
              {demo ? "EXPLORATION" : "NOCTYS HQ"}
            </span>
            <button
              className="icon"
              aria-label="Notifications"
              onClick={() => setModal("Notifications")}
            >
              <Bell size={19} />
              {notifications.length > 0 && <b>{notifications.length}</b>}
            </button>
            <button
              className="icon"
              aria-label="Déconnexion"
              onClick={() => {
                sessionStorage.removeItem("noctys-session");
                location.href = "/";
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="content">
          {demo && (
            <div className="demo-bar">
              <span>
                Mode démonstration · données d’exemple, modifications
                temporaires
              </span>
              <a href="/">
                Se connecter <ArrowUpRight size={14} />
              </a>
            </div>
          )}
          {error && (
            <div className="notice" role="alert">
              {error}
              <button
                className="icon"
                aria-label="Fermer le message"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {group === "macro" ? "PLAY AS ONE" : "BUILD YOUR EDGE"}
              </span>
              <h1>{view}</h1>
              <p>
                {(
                  {
                    "Stratbook builder":
                      "Chaque rôle. Chaque timing. Un plan commun.",
                    "Player roles":
                      "Un rôle clair, sur chaque map et chaque side.",
                    "Team schedule": "La semaine de l’équipe, au même endroit.",
                    Dictionary: "Les mêmes mots. La même intention.",
                    Stats:
                      "Comprendre votre jeu pour choisir le prochain axe de travail.",
                  } as any
                )[view] ||
                  (group === "macro"
                    ? "Préparer, partager et progresser ensemble."
                    : "Votre espace de progression individuelle.")}
              </p>
            </div>
            <div className="heading-actions">
              {view === "Stratbook builder" && (
                <button
                  onClick={() =>
                    download(
                      "NOCTYS-stratbook",
                      rows.filter((x) => x.kind === "strat"),
                    )
                  }
                >
                  <Download size={16} /> Exporter le book
                </button>
              )}
              {![
                "Tactical board",
                "Demo analyzer",
                "Player roles",
                "Stats",
                "Aim routine",
                "Nade King",
                "Team chat",
                "Personnel chat",
              ].includes(view) &&
                (editable || (view === "Team schedule" && scheduleRights)) && (
                  <button className="primary" onClick={create}>
                    <Plus size={18} />
                    {view === "Stratbook builder"
                      ? "Nouvelle strat"
                      : "Ajouter"}
                  </button>
                )}
            </div>
          </div>
          <div hidden={view !== "Tactical board"}>
            <TacticalBoard
              rows={rows}
              save={save}
              editable={staff}
              demo={demo}
            />
          </div>
          <div hidden={view !== "Demo analyzer"}>
            <DemoLibrary
              rows={rows}
              players={players}
              me={me}
              save={save}
              editable={staff}
              demo={demo}
            />
          </div>
          {["Tactical board", "Demo analyzer"].includes(view) ? null : view ===
            "Stratbook builder" ? (
            <>
              <div className="summary-strip">
                <div>
                  <BookOpen size={19} />
                  <strong>
                    {rows.filter((r) => r.kind === "strat").length}
                  </strong>
                  <span>Stratégies</span>
                </div>
                <div>
                  <Layers size={19} />
                  <strong>
                    {
                      new Set(
                        rows
                          .filter((r) => r.kind === "strat")
                          .map((r) => r.map),
                      ).size
                    }
                  </strong>
                  <span>Maps travaillées</span>
                </div>
                <div>
                  <Users size={19} />
                  <strong>
                    {
                      players.filter((p) => ["joueur", "IGL"].includes(p.role))
                        .length
                    }
                  </strong>
                  <span>Joueurs</span>
                </div>
                <div className="summary-note">
                  <span className="purple-dot" />{" "}
                  {demo
                    ? "Exemples de préparation"
                    : "Votre préparation collective"}
                </div>
              </div>
              <div className="filters">
                <div className="search">
                  <Search size={17} />
                  <input
                    aria-label="Rechercher une stratégie"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher une stratégie…"
                  />
                </div>
                <select
                  aria-label="Filtrer la map"
                  value={map}
                  onChange={(e) => setMap(e.target.value)}
                >
                  <option>Toutes les maps</option>
                  {maps.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <div className="segmented">
                  {["Tous", "T", "CT"].map((s) => (
                    <button
                      key={s}
                      className={side === s ? "on" : ""}
                      onClick={() => setSide(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <span className="fine">{filtered.length} stratégies</span>
              </div>
              <div className="strat-layout">
                <div className="strat-list">
                  {filtered.map((r, i) => (
                    <button
                      key={r.id}
                      className={
                        "strat-card " + (strat?.id === r.id ? "chosen" : "")
                      }
                      onClick={() => setSelected(r.id)}
                    >
                      <div className="strat-meta">
                        <span>{r.map?.toUpperCase()}</span>
                        <span className={"badge " + r.data.side}>
                          {r.data.side}
                        </span>
                      </div>
                      <strong>{r.title}</strong>
                      <div className="strat-bottom">
                        <span>{r.data.buy}</span>
                        <span>{r.data.actions?.length || 0} actions</span>
                      </div>
                    </button>
                  ))}
                  {!filtered.length && (
                    <Empty text="Aucune stratégie pour ces filtres." />
                  )}
                  <div className="side-note">
                    <Shield size={20} />
                    <p>
                      La préparation fait
                      <br />
                      la différence.
                    </p>
                    <span>Un plan clair laisse plus de place au jeu.</span>
                  </div>
                </div>
                {strat ? (
                  <Strategy
                    row={strat}
                    players={players}
                    dictionary={rows.filter((r) => r.kind === "dictionary")}
                    editable={staff}
                    save={save}
                    edit={() => {
                      setEditing(strat);
                      setModal(view);
                    }}
                  />
                ) : (
                  <Empty text="Créez votre première stratégie pour construire le stratbook." />
                )}
              </div>
            </>
          ) : view === "Player roles" ? (
            <Roles rows={rows} players={players} save={save} editable={staff} />
          ) : view.includes("schedule") ? (
            <Schedule
              rows={rows}
              me={me}
              personal={personal}
              week={week}
              setWeek={setWeek}
              edit={(r) => {
                setEditing(r);
                setModal(view);
              }}
              canEdit={scheduleRights}
            />
          ) : view.includes("chat") ? (
            <Chat
              rows={rows}
              players={players}
              me={me}
              personal={personal}
              recipient={recipient}
              setRecipient={setRecipient}
              save={save}
            />
          ) : view === "Stats" ? (
            <FaceitPanel nickname={me?.faceit || ""} />
          ) : view === "Aim routine" ? (
            <Routine save={save} me={me} />
          ) : view === "Nade King" ? (
            <Nades />
          ) : (
            <>
              <div className="filters">
                <div className="search">
                  <Search size={17} />
                  <input
                    aria-label="Rechercher"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher dans cet espace…"
                  />
                </div>
                <select
                  aria-label="Filtrer la map"
                  value={map}
                  onChange={(e) => setMap(e.target.value)}
                >
                  <option>Toutes les maps</option>
                  {maps.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              {view.includes("Demo") && (
                <div className="notice">
                  Les fichiers .dem sont archivés dans Supabase. La lecture 2D
                  nécessite le moteur DemoQuery, pas encore connecté. Vous
                  pouvez déjà annoter les démos et taguer les joueurs.
                </div>
              )}
              {view === "Opponents" && (
                <FaceitPanel team save={staff ? save : undefined} />
              )}
              <div className="library-grid">
                {filtered.map((r) => (
                  <article className="panel library-card" key={r.id}>
                    <div className="row">
                      <span className="eyebrow">
                        {r.map || "GÉNÉRAL"}
                        {r.data.side ? " · " + r.data.side : ""}
                      </span>
                      {editable && (
                        <button
                          className="icon"
                          aria-label={"Modifier " + r.title}
                          onClick={() => {
                            setEditing(r);
                            setModal(view);
                          }}
                        >
                          <Settings size={16} />
                        </button>
                      )}
                    </div>
                    <h3>{r.title}</h3>
                    <p>{r.body}</p>
                    {r.data.opponent && (
                      <p className="badge">
                        {rows.find((x) => x.id === r.data.opponent)?.title ||
                          "Adversaire"}
                      </p>
                    )}
                    {r.data.goal && (
                      <p>
                        <strong>Objectif · </strong>
                        {r.data.goal}
                      </p>
                    )}
                    {r.data.players && (
                      <span className="badge">
                        {r.data.players} joueurs synchronisés
                      </span>
                    )}
                    {r.data.tag && (
                      <p className="fine">
                        Pour @
                        {players.find((x) => x.id === r.data.tag)?.username ||
                          r.data.tag}
                      </p>
                    )}
                    {r.data.url && (
                      <a
                        className="resource-link"
                        href={safeUrl(r.data.url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ouvrir la ressource <ArrowUpRight size={15} />
                      </a>
                    )}
                    {r.data.file && (
                      <button
                        onClick={async () => {
                          try {
                            window.open(
                              await fileUrl(r.data.file),
                              "_blank",
                              "noopener",
                            );
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      >
                        Ouvrir la pièce jointe
                      </button>
                    )}
                    {view === "Anti strat" && (
                      <Board
                        points={r.data.points || []}
                        editable={staff}
                        onChange={(points) =>
                          save({ ...r, data: { ...r.data, points } })
                        }
                      />
                    )}
                    {view.includes("Demo") && (
                      <Notes
                        row={r}
                        players={players}
                        save={save}
                        editable={editable}
                      />
                    )}
                    {editable && (
                      <button
                        className="delete"
                        onClick={() => {
                          setEditing(r);
                          setModal("Supprimer");
                        }}
                      >
                        <Trash2 size={14} /> Supprimer
                      </button>
                    )}
                  </article>
                ))}
              </div>
              {!filtered.length && (
                <Empty text="Cet espace est prêt pour votre premier contenu." />
              )}
            </>
          )}
        </main>
        <footer className="workspace-footer">
          <span>NOCTYS E-SPORTS</span>
          <span>
            {demo
              ? "Exploration sans sauvegarde"
              : "Données privées · Supabase"}
          </span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row">
              <h2>
                {editing ? "Modifier · " : ""}
                {modal}
              </h2>
              <button
                className="icon"
                aria-label="Fermer"
                onClick={() => {
                  setModal(null);
                  setEditing(null);
                }}
              >
                <X size={21} />
              </button>
            </div>
            {error && (
              <p className="notice" role="alert">
                {error}
              </p>
            )}
            {modal === "Notifications" ? (
              <>
                <p className="muted">Nouveaux messages de cette session</p>
                {notifications.map((n) => (
                  <p key={n.id}>{n.body}</p>
                ))}
                {!notifications.length && <p>Aucun nouveau message.</p>}
                <button onClick={() => setNotifications([])}>
                  Tout marquer comme lu
                </button>
              </>
            ) : modal === "Membres" ? (
              <Members
                demo={demo}
                onApproved={async () => {
                  const ps = await api(
                    "/rest/v1/profiles?active=eq.true&select=id,username,role,steam_id,info,avatar,faceit",
                  );
                  setPlayers(ps);
                }}
              />
            ) : modal === "Supprimer" ? (
              <>
                <p>
                  Supprimer « {editing?.title} » ? Cette action est définitive.
                </p>
                <button
                  className="primary"
                  onClick={() => {
                    if (editing) remove(editing);
                    setEditing(null);
                    setModal(null);
                  }}
                >
                  Confirmer la suppression
                </button>
              </>
            ) : modal === "Profil" ? (
              <Profile
                me={me}
                demo={demo}
                done={(p) => {
                  setMe(p);
                  setModal(null);
                }}
                error={setError}
              />
            ) : (
              <RecordForm
                view={view}
                group={group}
                row={editing}
                players={players}
                opponents={rows.filter((r) => r.kind === "opponent")}
                busy={busy}
                submit={async (f, file) => {
                  setBusy(true);
                  try {
                    const data: any = { ...(editing?.data || {}), ...f };
                    const record: Row = {
                      id: editing?.id || crypto.randomUUID(),
                      kind: view.includes("schedule") ? "event" : kind,
                      title: f.title,
                      body: f.body || "",
                      map: f.map || undefined,
                      scope: editing?.scope || (personal ? "personal" : "team"),
                      owner_id: editing?.owner_id || me?.id,
                      data,
                    };
                    if (file) {
                      if (demo)
                        throw new Error(
                          "Les pièces jointes nécessitent une connexion réelle.",
                        );
                      data.file = await upload(file, me.id);
                    }
                    if (record.kind === "strat")
                      Object.assign(data, {
                        actions: data.actions || [],
                        points: data.points || [],
                      });
                    if (record.kind === "event") {
                      data.start = new Date(f.start).toISOString();
                      data.end = new Date(f.end).toISOString();
                      if (data.end <= data.start)
                        throw new Error("La fin doit être après le début.");
                    }
                    await persist(record);
                    setModal(null);
                    setEditing(null);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
