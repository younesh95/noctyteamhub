"use client";
import { useEffect, useState } from "react";
import { maps, Row, download } from "../../lib/domain/model";
import { defaultSteps, validateSteps, simulate } from "./engine.mjs";
import { defaultBot, validateBot, chooseMap } from "./bot.mjs";
import BotSettings, { BotConfig } from "./BotSettings";
export default function VetoSimulator({
  rows,
  save,
  editable,
}: {
  rows: Row[];
  save: (r: Row) => Promise<boolean>;
  editable: boolean;
}) {
  const [format, setFormat] = useState("BO3"),
    [steps, setSteps] = useState(defaultSteps("BO3"));
  const [history, setHistory] = useState<string[]>([]),
    [teams, setTeams] = useState({ A: "NOCTYS", B: "Adversaire" });
  const [sides, setSides] = useState<Record<string, string>>({}),
    [title, setTitle] = useState("Préparation veto");
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const [bot, setBot] = useState<BotConfig>(defaultBot);
  const [running, setRunning] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<ReturnType<typeof chooseMap>[]>(
    [],
  );
  const error = validateSteps(format, steps) || validateBot(bot, maps);
  const result = !error ? simulate(format, maps, steps, history) : null;
  const botTurn =
    !!result?.next &&
    (bot.mode === "both" ||
      (bot.mode === "opponent" && result.next.team === "B"));
  useEffect(() => {
    if (!running || !botTurn || error || busy) return;
    const timer = window.setTimeout(() => {
      const decision = chooseMap(maps, steps, history, bot);
      if (decision) {
        setStatus("");
        setHistory([...history, decision.map]);
        setDecisions([...decisions, decision]);
        setRecommendations([...recommendations, null]);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    running,
    botTurn,
    error,
    busy,
    steps,
    history,
    bot,
    decisions,
    recommendations,
  ]);
  useEffect(() => {
    if (result?.complete) setRunning(false);
  }, [result?.complete]);
  function reset() {
    if (history.length && !window.confirm("Recommencer cette simulation ?"))
      return;
    setHistory([]);
    setDecisions([]);
    setRecommendations([]);
    setRunning(false);
    setSides({});
    setStatus("");
  }
  async function persist() {
    setRunning(false);
    setBusy(true);
    try {
      const ok = await save({
        id: crypto.randomUUID(),
        kind: "veto",
        scope: "team",
        title: title.trim() || "Veto " + format,
        body: "",
        data: {
          format,
          steps,
          history,
          teams,
          sides,
          bot,
          decisions,
          recommendations,
        },
      });
      setStatus(
        ok
          ? "Simulation enregistrée."
          : "Sauvegarde impossible. Vérifiez la migration 003.",
      );
    } finally {
      setBusy(false);
    }
  }
  function load(row: Row) {
    if (history.length && !window.confirm("Remplacer la simulation en cours ?"))
      return;
    try {
      const d = row.data;
      simulate(d.format, maps, d.steps, d.history);
      const loadedBot = d.bot || { ...defaultBot(), mode: "manual" };
      if (validateBot(loadedBot, maps)) throw Error("Profil bot invalide");
      setFormat(d.format);
      setSteps(d.steps);
      setHistory(d.history);
      setBot(loadedBot);
      setRecommendations(d.recommendations || []);
      setDecisions(
        d.history.map((map: string, i: number) => {
          const decision = d.decisions?.[i];
          return decision?.map === map && typeof decision.reason === "string"
            ? decision
            : null;
        }),
      );
      setRunning(false);
      setTeams({ A: d.teams?.A || "NOCTYS", B: d.teams?.B || "Adversaire" });
      setSides(d.sides || {});
      setTitle(row.title);
      setStatus("Simulation chargée.");
    } catch {
      setStatus("Cette simulation est invalide.");
    }
  }
  return (
    <div className="veto-layout">
      <section className="panel">
        <span className="eyebrow">MAP POOL / PRÉPARATION</span>
        <h2>Construisez votre veto</h2>
        <section className="veto-profile-library">
          <label>
            Profil d’adversaire enregistré
            <select
              value={profileId}
              disabled={busy || running || !!history.length}
              onChange={(e) => {
                setProfileId(e.target.value);
                const r = rows.find((r) => r.id === e.target.value);
                if (r) {
                  const error = validateBot(r.data.bot, maps);
                  if (error) {
                    setStatus(error);
                    return;
                  }
                  setBot(r.data.bot);
                  setTeams({
                    A:
                      typeof r.data.teams?.A === "string"
                        ? r.data.teams.A
                        : "NOCTYS",
                    B:
                      typeof r.data.teams?.B === "string"
                        ? r.data.teams.B
                        : "Adversaire",
                  });
                  setStatus("Classements et équipes chargés.");
                }
              }}
            >
              <option value="">Nouveau profil</option>
              {rows
                .filter((r) => r.kind === "veto" && r.data.profileOnly)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
            </select>
          </label>
          {editable && (
            <button
              disabled={!!error || busy || running || !!history.length}
              onClick={async () => {
                setBusy(true);
                try {
                  const old = rows.find((r) => r.id === profileId);
                  const id = old?.id || crypto.randomUUID();
                  if (
                    await save({
                      ...old,
                      id,
                      kind: "veto",
                      scope: "team",
                      title: ("Profil · " + teams.B).slice(0, 150),
                      body: "Classements de préparation du veto",
                      data: { profileOnly: true, teams, bot },
                    })
                  ) {
                    setProfileId(id);
                    setStatus(
                      "Profil enregistré pour vos prochaines simulations.",
                    );
                  }
                } finally {
                  setBusy(false);
                }
              }}
            >
              {profileId ? "Mettre à jour le profil" : "Enregistrer ce profil"}
            </button>
          )}
        </section>
        <p className="fine">
          Jouez l’équipe A contre le bot qui contrôle l’équipe B. Réglez les
          bans habituels et les forces de chaque équipe ci-dessous avant de
          commencer.
        </p>
        <div className="board-actions">
          <button
            className="primary"
            disabled={!!error || busy || running || !!history.length}
            onClick={() => {
              setBot({ ...bot, mode: "opponent" });
              setStatus("");
              setRunning(true);
            }}
          >
            Jouer contre le bot
          </button>
          <button
            disabled={!!error || busy || running || !!history.length}
            onClick={() => {
              setBot({ ...bot, mode: "both" });
              setStatus("");
              setRunning(true);
            }}
          >
            Simuler les deux équipes
          </button>
        </div>
        {!!history.length && (
          <p className="fine">
            Recommencez la simulation pour changer de mode de jeu.
          </p>
        )}
        <div className="two">
          <label>
            Équipe A
            <input
              value={teams.A}
              disabled={busy}
              maxLength={40}
              onChange={(e) => {
                setTeams({ ...teams, A: e.target.value });
                setStatus("");
              }}
            />
          </label>
          <label>
            Équipe B
            <input
              value={teams.B}
              disabled={busy}
              maxLength={40}
              onChange={(e) => {
                setTeams({ ...teams, B: e.target.value });
                setStatus("");
              }}
            />
          </label>
        </div>
        <label>
          Format
          <select
            value={format}
            disabled={!!history.length || running || busy}
            onChange={(e) => {
              setFormat(e.target.value);
              setStatus("");
              setSteps(defaultSteps(e.target.value));
              setSides({});
            }}
          >
            <option>BO1</option>
            <option>BO3</option>
          </select>
        </label>
        <details>
          <summary>Personnaliser les picks et bans</summary>
          <p className="fine">
            Choisissez l’équipe et l’action de chaque étape. La dernière map est
            le decider. Recommencez pour modifier une séquence déjà entamée.
          </p>
          {steps.map((step, i) => (
            <div className="veto-step" key={i}>
              <span>{i + 1}</span>
              <select
                aria-label={"Équipe étape " + (i + 1)}
                disabled={!!history.length || running || busy}
                value={step.team}
                onChange={(e) => {
                  setStatus("");
                  setSteps(
                    steps.map((s, j) =>
                      j === i ? { ...s, team: e.target.value } : s,
                    ),
                  );
                }}
              >
                <option value="A">{teams.A || "A"}</option>
                <option value="B">{teams.B || "B"}</option>
              </select>
              <select
                aria-label={"Action étape " + (i + 1)}
                disabled={!!history.length || running || busy}
                value={step.action}
                onChange={(e) => {
                  setStatus("");
                  setSteps(
                    steps.map((s, j) =>
                      j === i ? { ...s, action: e.target.value } : s,
                    ),
                  );
                }}
              >
                <option value="ban">Ban</option>
                <option value="pick">Pick</option>
              </select>
            </div>
          ))}
        </details>
        {error && <p role="alert">{error}</p>}
        <BotSettings
          config={bot}
          setConfig={(value) => {
            setBot(value);
            setStatus("");
          }}
          teams={teams}
          locked={!!history.length || running || busy}
        />
        {bot.mode !== "manual" && (
          <div className="board-actions">
            <button
              className="primary"
              disabled={!!error || result?.complete || busy}
              onClick={() => setRunning(!running)}
            >
              {running ? "Mettre le bot en pause" : "Lancer le bot"}
            </button>
            <span className="fine" role="status">
              {result?.complete
                ? "Simulation terminée"
                : running
                  ? botTurn
                    ? "Le bot prépare son choix…"
                    : `À vous de jouer : ${teams.A}`
                  : "Bot en pause · vous pouvez aussi choisir les maps manuellement"}
            </span>
          </div>
        )}
        <div className="veto-turn" aria-live="polite">
          {result?.complete
            ? "Veto terminé"
            : result?.next
              ? `${teams[result.next.team as "A" | "B"]} · ${result.next.action === "ban" ? "bannit" : "choisit"} une map`
              : "Corrigez la séquence"}
        </div>
        <div className="veto-maps">
          {maps.map((map) => {
            const turn = result?.turns.find((t) => t.map === map);
            return (
              <button
                key={map}
                disabled={
                  !!error ||
                  !!turn ||
                  result?.complete ||
                  busy ||
                  (running && botTurn)
                }
                onClick={() => {
                  setHistory([...history, map]);
                  setStatus("");
                  setDecisions([...decisions, null]);
                  setRecommendations([
                    ...recommendations,
                    chooseMap(maps, steps, history, bot),
                  ]);
                }}
                className={turn?.action || ""}
              >
                <img src={"/radars/" + map.toLowerCase() + ".png"} alt="" />
                <strong>{map}</strong>
                <small>
                  {turn
                    ? `${turn.action.toUpperCase()} · ${teams[turn.team as "A" | "B"]}`
                    : result?.decider === map
                      ? "DECIDER"
                      : "Disponible"}
                </small>
              </button>
            );
          })}
        </div>
        <div className="board-actions">
          <button
            disabled={!history.length || busy}
            onClick={() => {
              setHistory(history.slice(0, -1));
              setStatus("");
              setDecisions(decisions.slice(0, -1));
              setRecommendations(recommendations.slice(0, -1));
              setRunning(false);
              setSides({});
            }}
          >
            ↶ Annuler la dernière étape
          </button>
          <button disabled={busy} onClick={reset}>
            Recommencer
          </button>
        </div>
      </section>
      <aside className="panel">
        <h3>Déroulé du veto</h3>
        <ol className="veto-history">
          {result?.turns.map((t, i) => (
            <li key={i}>
              <span>{teams[t.team as "A" | "B"]}</span>
              <strong>
                {t.action.toUpperCase()} · {t.map}
              </strong>
              {decisions[i]?.reason && (
                <small className="fine">Bot · {decisions[i]!.reason}</small>
              )}
              {!decisions[i] && recommendations[i] && (
                <small className="fine">
                  Comparaison : le bot proposait {recommendations[i].map}
                  {recommendations[i].map === t.map
                    ? " · même choix"
                    : " · choix différent"}
                  . {recommendations[i].reason}
                </small>
              )}
            </li>
          ))}
        </ol>
        {result?.complete && (
          <>
            <h3>Maps du match</h3>
            {[...result.picks, result.decider!].map((map, i) => (
              <label key={map}>
                Map {i + 1} · {map}
                {map === result.decider ? " · decider" : ""}
                <select
                  aria-label={"Side NOCTYS " + map}
                  value={sides[map] || ""}
                  disabled={busy}
                  onChange={(e) => {
                    setStatus("");
                    setSides({ ...sides, [map]: e.target.value });
                  }}
                >
                  <option value="">Side de {teams.A} à déterminer</option>
                  <option value="T">{teams.A} commence T</option>
                  <option value="CT">{teams.A} commence CT</option>
                </select>
              </label>
            ))}
          </>
        )}
        <label>
          Nom de la simulation
          <input
            maxLength={150}
            value={title}
            disabled={busy}
            onChange={(e) => {
              setTitle(e.target.value);
              setStatus("");
            }}
          />
        </label>
        <div className="board-actions">
          <button
            disabled={!!error}
            onClick={() =>
              download(title, {
                format,
                steps,
                history,
                teams,
                sides,
                bot,
                decisions,
                recommendations,
                result,
              })
            }
          >
            Exporter JSON
          </button>
          {editable && (
            <button
              className="primary"
              disabled={busy || !!error}
              onClick={persist}
            >
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
          )}
        </div>
        <p role="status" className="fine">
          {status || "Simulation libre : aucune action envoyée à FACEIT."}
        </p>
        <h3>Simulations de l’équipe</h3>
        {rows
          .filter((r) => r.kind === "veto" && !r.data.profileOnly)
          .map((r) => (
            <button
              disabled={busy}
              className="saved-veto"
              key={r.id}
              onClick={() => load(r)}
            >
              {r.title} · {r.data.format} · {r.data.history?.length || 0}/6
              choix{" "}
              {r.created_at
                ? "· " + new Date(r.created_at).toLocaleDateString("fr-FR")
                : ""}
            </button>
          ))}
      </aside>
    </div>
  );
}
