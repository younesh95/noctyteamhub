"use client";
import { useState } from "react";
import { faceit, summarize, teamId } from "./client";
import { download, Row } from "../../lib/domain/model";
export default function FaceitPanel({
  nickname = "",
  team = false,
  save,
}: {
  nickname?: string;
  team?: boolean;
  save?: (row: Row) => Promise<boolean>;
}) {
  const [query, setQuery] = useState(
      nickname || (team ? "55a41dee-2ee2-4b0e-ba54-40222cd45ec5" : ""),
    ),
    [profile, setProfile] = useState<any>(null),
    [stats, setStats] = useState<any>(null),
    [matches, setMatches] = useState<any[]>([]),
    [detail, setDetail] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [offset, setOffset] = useState(0),
    [complete, setComplete] = useState(false);
  async function load() {
    setBusy(true);
    setError("");
    setDetail(null);
    setProfile(null);
    setStats(null);
    setMatches([]);
    setOffset(0);
    setComplete(false);
    try {
      const p = await faceit(
        team
          ? "/teams/" + teamId(query)
          : "/players?nickname=" + encodeURIComponent(query.trim()),
      );
      setProfile(p);
      const id = team ? p.team_id : p.player_id;
      const results = await Promise.allSettled([
        faceit("/" + (team ? "teams" : "players") + "/" + id + "/stats/cs2"),
        ...(!team
          ? [faceit("/players/" + id + "/history?game=cs2&offset=0&limit=20")]
          : []),
      ]);
      if (results[0].status === "fulfilled") setStats(results[0].value);
      else
        setError(
          "Profil trouvé ; statistiques indisponibles : " +
            results[0].reason.message,
        );
      if (!team && results[1]?.status === "fulfilled") {
        setMatches(results[1].value.items || []);
        setOffset(20);
        setComplete((results[1].value.items || []).length < 20);
      } else if (!team && results[1]?.status === "rejected")
        setError("Historique indisponible : " + results[1].reason.message);
      if (team) {
        const roster = p.members || [];
        const histories = await Promise.allSettled(
          roster
            .slice(0, 5)
            .map((m: any) =>
              faceit(
                "/players/" +
                  (m.user_id || m.player_id) +
                  "/history?game=cs2&offset=0&limit=20",
              ),
            ),
        );
        const found = new Map();
        for (const h of histories)
          if (h.status === "fulfilled")
            for (const m of h.value.items || [])
              if (
                Object.values(m.teams || {}).some((t: any) => t.team_id === id)
              )
                found.set(m.match_id, m);
        setMatches(
          [...found.values()].sort(
            (a: any, b: any) => (b.started_at || 0) - (a.started_at || 0),
          ),
        );
        if (histories.some((h) => h.status === "rejected"))
          setError(
            "Certains historiques de joueurs ne sont pas accessibles ; résultats partiels.",
          );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const summary = summarize(stats?.lifetime);
  return (
    <section className="faceit-panel panel">
      <div className="row">
        <div>
          <span className="eyebrow">FACEIT INTELLIGENCE</span>
          <h2>
            {team ? "Reconnaissance adversaire" : "Votre jeu, en chiffres"}
          </h2>
        </div>
        <span className="badge">Données publiques · CS2</span>
      </div>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <label className="grow">
          {team ? "Lien ou ID de l’équipe" : "Pseudo FACEIT"}
          <input
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button className="primary" disabled={busy}>
          {busy ? "Import en cours…" : "Récupérer les données"}
        </button>
      </form>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {profile && (
        <>
          <h3>
            {profile.nickname || profile.name}{" "}
            {profile.games?.cs2?.faceit_elo && (
              <span className="badge">{profile.games.cs2.faceit_elo} ELO</span>
            )}
          </h3>
          <div className="metric-grid">
            {[
              ["Matchs", summary.matches],
              ["Victoires", summary.win === null ? null : summary.win + " %"],
              ["K/D moyen", summary.kd],
              ["Headshots", summary.hs === null ? null : summary.hs + " %"],
            ].map(([k, v]) => (
              <div key={k}>
                <small>{k}</small>
                <strong>{v ?? "—"}</strong>
              </div>
            ))}
          </div>
          {stats && (
            <>
              <h3>Axes de review</h3>
              {summary.axes.map((a) => (
                <p key={a}>{a}</p>
              ))}
              <p className="fine">
                Indicateurs calculés sur les statistiques disponibles ; ce
                diagnostic par règles n’est pas une IA ni une analyse des
                positions en démo.
              </p>
              <details>
                <summary>Statistiques par map</summary>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Map / mode</th>
                        <th>Matchs</th>
                        <th>Victoires</th>
                        <th>K/D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats.segments || []).map((s: any, i: number) => (
                        <tr key={i}>
                          <td>
                            {s.label} · {s.mode}
                          </td>
                          <td>{s.stats?.Matches ?? "—"}</td>
                          <td>{s.stats?.["Win Rate %"] ?? "—"}</td>
                          <td>{s.stats?.["Average K/D Ratio"] ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
          {team && (
            <p className="fine">
              Historique partiel : matchs de cette équipe retrouvés dans les 20
              derniers matchs de chacun des cinq premiers membres. Les matchs
              ESEA non exposés par l’API ne sont pas inventés.
            </p>
          )}
          <div className="row">
            <h3>Matchs disponibles · {matches.length}</h3>
            <button
              onClick={() =>
                download("NOCTYS-FACEIT", { profile, stats, matches })
              }
            >
              Exporter les données
            </button>
            {team && save && (
              <button
                onClick={async () => {
                  const ok = await save({
                    id: crypto.randomUUID(),
                    kind: "opponent",
                    title:
                      profile.name || profile.nickname || "Adversaire FACEIT",
                    body: summary.axes.join("\n"),
                    data: {
                      url: "https://www.faceit.com/fr/teams/" + profile.team_id,
                      faceitId: profile.team_id,
                      stats,
                      importedAt: new Date().toISOString(),
                    },
                  });
                  setError(
                    ok
                      ? "Fiche adversaire enregistrée."
                      : "La fiche n’a pas été sauvegardée.",
                  );
                }}
              >
                Enregistrer la fiche
              </button>
            )}
          </div>
          {!matches.length && (
            <p className="fine">Aucun match récupéré pour cette sélection.</p>
          )}
          {matches.map((m) => (
            <div className="match-row" key={m.match_id}>
              <span>
                {m.started_at
                  ? new Date(m.started_at * 1000).toLocaleDateString("fr-FR")
                  : m.status}
              </span>
              <strong>
                {Object.values(m.teams || {})
                  .map((t: any) => t.nickname || t.name)
                  .join(" vs ")}
              </strong>
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    const [match, score] = await Promise.allSettled([
                      faceit("/matches/" + m.match_id),
                      faceit("/matches/" + m.match_id + "/stats"),
                    ]);
                    if (match.status === "rejected") throw match.reason;
                    setDetail({
                      match: match.value,
                      score: score.status === "fulfilled" ? score.value : null,
                    });
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Analyser
              </button>
            </div>
          ))}
          {!team && !complete && (
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const d = await faceit(
                    "/players/" +
                      profile.player_id +
                      "/history?game=cs2&offset=" +
                      offset +
                      "&limit=20",
                  );
                  setMatches((xs) => [...xs, ...(d.items || [])]);
                  setOffset(offset + 20);
                  setComplete((d.items || []).length < 20);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Charger 20 matchs supplémentaires
            </button>
          )}
          {detail && (
            <div className="match-detail">
              <h3>Détail du match</h3>
              <p>
                {detail.match.status} · {detail.match.competition_name}
              </p>
              {detail.score?.rounds?.map((r: any, i: number) => (
                <div key={i}>
                  <h4>
                    {r.round_stats?.Map} · {r.round_stats?.Score}
                  </h4>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Joueur</th>
                          <th>Kills</th>
                          <th>Deaths</th>
                          <th>ADR</th>
                          <th>HS %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.teams
                          ?.flatMap((t: any) => t.players || [])
                          .map((p: any) => (
                            <tr key={p.player_id}>
                              <td>{p.nickname}</td>
                              <td>{p.player_stats?.Kills ?? "—"}</td>
                              <td>{p.player_stats?.Deaths ?? "—"}</td>
                              <td>{p.player_stats?.ADR ?? "—"}</td>
                              <td>{p.player_stats?.["Headshots %"] ?? "—"}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {!detail.score && <p>Statistiques détaillées indisponibles.</p>}
              <p className="fine">
                Téléchargez la démo depuis la salle FACEIT puis importez-la dans
                la bibliothèque commune. L’API publique ne garantit pas un lien
                de démo.
              </p>
              <a
                href={
                  "https://www.faceit.com/fr/cs2/room/" + detail.match.match_id
                }
                target="_blank"
                rel="noreferrer"
              >
                Ouvrir la salle FACEIT ↗
              </a>
            </div>
          )}
        </>
      )}
    </section>
  );
}
