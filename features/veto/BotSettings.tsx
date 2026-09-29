import { maps } from "../../lib/domain/model";
import { defaultBot } from "./bot.mjs";

export type BotConfig = Omit<ReturnType<typeof defaultBot>, "profiles"> & {
  profiles: Record<"A" | "B", { bans: string[]; strengths: string[] }>;
};

export default function BotSettings({
  config,
  setConfig,
  teams,
  locked,
}: {
  config: BotConfig;
  setConfig: (v: BotConfig) => void;
  teams: { A: string; B: string };
  locked: boolean;
}) {
  function change(team: "A" | "B", kind: "bans" | "strengths", list: string[]) {
    setConfig({
      ...config,
      profiles: {
        ...config.profiles,
        [team]: { ...config.profiles[team], [kind]: list },
      },
    });
  }
  return (
    <details className="veto-bot-settings" open>
      <summary>Bot tactique · profils des équipes</summary>
      <p className="fine">
        Classez les bans les plus fréquents et les maps les plus fortes, du n°1
        au n°7. Vous pouvez laisser un classement incomplet. Les maps non
        renseignées restent neutres. Ces priorités sont vos estimations, pas des
        statistiques FACEIT importées.
      </p>
      <div className="two">
        <label>
          Pilotage
          <select
            value={config.mode}
            disabled={locked}
            onChange={(e) => setConfig({ ...config, mode: e.target.value })}
          >
            <option value="opponent">
              Je joue NOCTYS · bot adversaire (B)
            </option>
            <option value="both">Bot pour les deux équipes</option>
            <option value="manual">Entièrement manuel</option>
          </select>
        </label>
        <label>
          Variation des décisions : {config.variation}%
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            disabled={locked}
            value={config.variation}
            onChange={(e) =>
              setConfig({ ...config, variation: Number(e.target.value) })
            }
          />
        </label>
      </div>
      <label>
        Graine de simulation
        <input
          value={config.seed}
          maxLength={80}
          disabled={locked}
          onChange={(e) => setConfig({ ...config, seed: e.target.value })}
        />
      </label>
      <p className="fine">
        Même graine, mêmes choix. À 0%, le bot privilégie strictement ses
        scores. Une autre graine fait varier les décisions proches. Recommencez
        le veto pour modifier les profils.
      </p>
      <div className="veto-profiles">
        {(["A", "B"] as const).map((team) => (
          <section key={team}>
            <h3>{teams[team] || team}</h3>
            {(["bans", "strengths"] as const).map((kind) => {
              const list = config.profiles[team][kind];
              const label = kind === "bans" ? "Bans fréquents" : "Maps fortes";
              return (
                <div key={kind} className="veto-ranking">
                  <h4>{label}</h4>
                  {list.map((map, i) => (
                    <div className="veto-rank" key={map}>
                      <span>
                        {i + 1}. {map}
                      </span>
                      <button
                        aria-label={`${team} ${label} : monter ${map}`}
                        disabled={locked || i === 0}
                        onClick={() => {
                          const next = [...list];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          change(team, kind, next);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        aria-label={`${team} ${label} : descendre ${map}`}
                        disabled={locked || i === list.length - 1}
                        onClick={() => {
                          const next = [...list];
                          [next[i + 1], next[i]] = [next[i], next[i + 1]];
                          change(team, kind, next);
                        }}
                      >
                        ↓
                      </button>
                      <button
                        aria-label={`${team} ${label} : retirer ${map}`}
                        disabled={locked}
                        onClick={() =>
                          change(
                            team,
                            kind,
                            list.filter((m) => m !== map),
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <select
                    aria-label={`${team} ${label} : ajouter une map`}
                    value=""
                    disabled={locked || list.length === maps.length}
                    onChange={(e) => {
                      if (e.target.value)
                        change(team, kind, [...list, e.target.value]);
                    }}
                  >
                    <option value="">Ajouter au rang {list.length + 1}</option>
                    {maps
                      .filter((m) => !list.includes(m))
                      .map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                  </select>
                </div>
              );
            })}
          </section>
        ))}
      </div>
      <p className="fine">
        IA tactique locale : le bot combine habitudes de ban, forces et
        faiblesses relatives. Aucune clé IA ni connexion externe nécessaire ;
        ses scores ne sont pas des probabilités de victoire.
      </p>
    </details>
  );
}
