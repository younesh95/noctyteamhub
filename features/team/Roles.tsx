"use client";
import { useState } from "react";
import { Row, maps } from "../../lib/domain/model";
type Player = { id: string; username: string; role: string };
type Slot = { id: string; name: string; profileId: string };
export default function Roles({
  rows,
  players,
  save,
  editable,
}: {
  rows: Row[];
  players: Player[];
  save: (r: Row) => Promise<boolean>;
  editable: boolean;
}) {
  const roster = rows.find((r) => r.kind === "roster");
  const accounts = players.filter((p) => ["joueur", "IGL"].includes(p.role));
  const defaults: Slot[] = Array.from({ length: 7 }, (_, i) => ({
    id: accounts[i]?.id || "slot-" + (i + 1),
    name: accounts[i]?.username || "Joueur " + (i + 1),
    profileId: accounts[i]?.id || "",
  }));
  const slots: Slot[] =
    Array.isArray(roster?.data.slots) && roster.data.slots.length === 7
      ? roster.data.slots
      : defaults;
  const [draft, setDraft] = useState<Slot[] | null>(null),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  async function storeRoster() {
    if (!draft) return;
    if (draft.some((s) => !s.name.trim())) {
      setStatus("Chaque emplacement doit avoir un nom.");
      return;
    }
    const linked = draft.map((s) => s.profileId).filter(Boolean);
    if (new Set(linked).size !== linked.length) {
      setStatus("Un compte ne peut occuper qu’un emplacement.");
      return;
    }
    setBusy(true);
    try {
      if (
        await save({
          ...roster,
          id: roster?.id || crypto.randomUUID(),
          kind: "roster",
          scope: "team",
          title: "Effectif NOCTYS",
          body: "",
          data: { slots: draft.map((s) => ({ ...s, name: s.name.trim() })) },
        })
      ) {
        setDraft(null);
        setStatus(
          "Effectif enregistré. Aucun compte utilisateur n’a été créé.",
        );
      } else setStatus("Effectif non enregistré. Vérifiez la migration 003.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="roles">
      <section className="panel">
        <div className="row">
          <div>
            <span className="eyebrow">EFFECTIF / 7 JOUEURS</span>
            <h3>Préparer les rôles avant les inscriptions</h3>
          </div>
          {editable && !draft && (
            <button onClick={() => setDraft(slots.map((s) => ({ ...s })))}>
              Configurer l’effectif
            </button>
          )}
        </div>
        <p className="fine">
          Sept emplacements indépendants des comptes. Les rôles restent uniques
          sur chaque side ; laissez les remplaçants sans rôle. Les comptes
          seront liés après inscription et activation.
        </p>
        {draft && (
          <>
            <div className="roster-grid">
              {draft.map((s, i) => (
                <div key={s.id}>
                  <label>
                    Joueur {i + 1}
                    <input
                      maxLength={40}
                      value={s.name}
                      disabled={busy}
                      onChange={(e) =>
                        setDraft(
                          draft.map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Compte associé
                    <select
                      disabled={busy}
                      value={s.profileId}
                      onChange={(e) =>
                        setDraft(
                          draft.map((x, j) =>
                            j === i ? { ...x, profileId: e.target.value } : x,
                          ),
                        )
                      }
                    >
                      <option value="">En attente d’inscription</option>
                      {accounts.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={draft.some(
                            (x, j) => j !== i && x.profileId === p.id,
                          )}
                        >
                          {p.username}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>
            <div className="board-actions">
              <button disabled={busy} onClick={() => setDraft(null)}>
                Annuler
              </button>
              <button className="primary" disabled={busy} onClick={storeRoster}>
                Enregistrer les sept joueurs
              </button>
            </div>
          </>
        )}
        <p className="fine" role="status">
          {status}
        </p>
      </section>
      {maps.map((map) => {
        const r = rows.find((r) => r.kind === "roles" && r.map === map);
        return (
          <section className="panel" key={map}>
            <h3>{map}</h3>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>SIDE</th>
                    {slots.map((p) => (
                      <th key={p.id}>
                        {p.name}
                        <small className="roster-account">
                          {accounts.find((a) => a.id === p.profileId)
                            ?.username || "Compte à créer"}
                        </small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["T", "CT"].map((side) => (
                    <tr key={side}>
                      <th>
                        <span className={"badge " + side}>{side}</span>
                      </th>
                      {slots.map((p) => (
                        <td key={p.id}>
                          <select
                            aria-label={map + " " + side + " " + p.name}
                            disabled={!editable || busy || !!draft}
                            value={r?.data[side]?.[p.id] || ""}
                            onChange={async (e) => {
                              const value = e.target.value;
                              setBusy(true);
                              try {
                                if (
                                  !roster &&
                                  !(await save({
                                    id: crypto.randomUUID(),
                                    kind: "roster",
                                    scope: "team",
                                    title: "Effectif NOCTYS",
                                    body: "",
                                    data: { slots },
                                  }))
                                ) {
                                  setStatus(
                                    "Effectif non enregistré. Vérifiez la migration 003.",
                                  );
                                  return;
                                }
                                await save({
                                  ...r,
                                  id: r?.id || crypto.randomUUID(),
                                  kind: "roles",
                                  scope: "team",
                                  title: map,
                                  body: "",
                                  map,
                                  data: {
                                    ...r?.data,
                                    [side]: { ...r?.data[side], [p.id]: value },
                                  },
                                });
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            <option value="">Réserve / à attribuer</option>
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
                                  r?.data[side] || {},
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
          </section>
        );
      })}
    </div>
  );
}
