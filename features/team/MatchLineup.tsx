"use client";
import { useEffect, useState } from "react";
import { api, refreshSession } from "../../lib/supabase";
import { Row, maps, download } from "../../lib/domain/model";
type Slot = { id: string; name: string; profileId: string };
export default function MatchLineup({
  rows,
  slots,
  me,
  save,
  editable,
  demo,
  rosterReady,
}: {
  rows: Row[];
  slots: Slot[];
  me: any;
  save: (r: Row) => Promise<boolean>;
  editable: boolean;
  demo: boolean;
  rosterReady: boolean;
}) {
  const events = rows
    .filter((r) => r.kind === "event" && r.scope === "team")
    .sort((a, b) => b.data.start.localeCompare(a.data.start));
  const [eventId, setEventId] = useState(""),
    [chosen, setChosen] = useState<string[]>([]),
    [availability, setAvailability] = useState<any[]>([]),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [map, setMap] = useState("Mirage");
  const event = events.find((r) => r.id === eventId);
  useEffect(() => {
    setChosen(event?.data.lineup || []);
    setMap(event?.data.lineupMap || event?.map || "Mirage");
  }, [eventId, event?.updated_at]);
  useEffect(() => {
    if (!eventId || demo) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    async function read() {
      try {
        await refreshSession();
        const r = await api(
          "/rest/v1/match_availability?event_id=eq." + eventId + "&select=*",
        );
        if (alive) setAvailability(r);
      } catch {
        if (alive)
          setStatus(
            "Les disponibilités nécessitent la migration Supabase 005.",
          );
      } finally {
        if (alive) timer = setTimeout(read, 10000);
      }
    }
    read();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [eventId, demo]);
  const roles =
    event?.data.lineupRoles ||
    rows.find((r) => r.kind === "roles" && r.map === map)?.data ||
    {};
  return (
    <section className="panel">
      <span className="eyebrow">MATCH / TITULAIRES & REMPLAÇANTS</span>
      <h3>Préparer les cinq du match</h3>
      <label>
        Match ou entraînement
        <select
          value={eventId}
          onChange={(e) => {
            setEventId(e.target.value);
            setAvailability([]);
            setStatus("");
          }}
        >
          <option value="">Choisir un événement d’équipe</option>
          {events.map((r) => (
            <option key={r.id} value={r.id}>
              {new Date(r.data.start).toLocaleDateString("fr-FR")} · {r.title}
            </option>
          ))}
        </select>
      </label>
      {!events.length && (
        <p className="fine">Ajoutez d’abord un match dans Team schedule.</p>
      )}
      {event && (
        <>
          <label>
            Ma disponibilité
            <select
              value={
                availability.find((a) => a.profile_id === me?.id)?.status || ""
              }
              disabled={busy}
              onChange={async (e) => {
                const value = e.target.value;
                if (!value) return;
                setBusy(true);
                try {
                  const entry = {
                    event_id: eventId,
                    profile_id: me.id,
                    status: value,
                  };
                  if (!demo) {
                    await refreshSession();
                    await api(
                      "/rest/v1/match_availability?on_conflict=event_id,profile_id",
                      {
                        method: "POST",
                        headers: { Prefer: "resolution=merge-duplicates" },
                        body: JSON.stringify(entry),
                      },
                    );
                  }
                  setAvailability((v) => [
                    entry,
                    ...v.filter((a) => a.profile_id !== me.id),
                  ]);
                  setStatus("Disponibilité enregistrée.");
                } catch {
                  setStatus(
                    "Enregistrement impossible. Vérifiez la migration 005 et la connexion.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <option value="">Non renseignée</option>
              {["Disponible", "Incertain", "Absent"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Map de la composition
            <select value={map} onChange={(e) => setMap(e.target.value)}>
              {maps.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <div className="lineup-grid">
            {slots.map((s) => (
              <label className="lineup-player" key={s.id}>
                <input
                  type="checkbox"
                  checked={chosen.includes(s.id)}
                  disabled={
                    !editable ||
                    busy ||
                    !rosterReady ||
                    (!chosen.includes(s.id) && chosen.length === 5)
                  }
                  onChange={(e) =>
                    setChosen((v) =>
                      e.target.checked
                        ? [...v, s.id]
                        : v.filter((id) => id !== s.id),
                    )
                  }
                />
                <strong>{s.name}</strong>
                <span>
                  {availability.find((a) => a.profile_id === s.profileId)
                    ?.status || "Disponibilité non renseignée"}
                </span>
                <small>
                  {chosen.includes(s.id) ? "Titulaire" : "Remplaçant"}
                </small>
              </label>
            ))}
          </div>
          <p className="fine">
            {chosen.length}/5 titulaires. Les deux autres joueurs restent
            remplaçants.{" "}
            {!rosterReady &&
              "Enregistrez d’abord les sept joueurs pour préparer une composition."}
          </p>
          {editable && (
            <button
              className="primary"
              disabled={busy || chosen.length !== 5 || !rosterReady}
              onClick={async () => {
                setBusy(true);
                try {
                  const base =
                    (event.data.lineupMap === map && event.data.lineupRoles) ||
                    rows.find((r) => r.kind === "roles" && r.map === map)
                      ?.data ||
                    {};
                  const snapshot = {
                    T: Object.fromEntries(
                      chosen.map((id) => [id, base.T?.[id] || ""]),
                    ),
                    CT: Object.fromEntries(
                      chosen.map((id) => [id, base.CT?.[id] || ""]),
                    ),
                  };
                  if (
                    await save({
                      ...event,
                      data: {
                        ...event.data,
                        lineup: chosen,
                        lineupMap: map,
                        lineupRoles: snapshot,
                      },
                    })
                  )
                    setStatus("Composition et rôles du match enregistrés.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Enregistrer les titulaires et leurs rôles
            </button>
          )}
          {event.data.lineup?.length === 5 && (
            <>
              <h4>Composition enregistrée · {event.data.lineupMap}</h4>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Joueur</th>
                      <th>T</th>
                      <th>CT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.data.lineup.map((id: string) => (
                      <tr key={id}>
                        <td>
                          {slots.find((s) => s.id === id)?.name ||
                            "Ancien emplacement"}
                        </td>
                        {(["T", "CT"] as const).map((side) => (
                          <td key={side}>
                            <select
                              aria-label={
                                "Rôle match " +
                                side +
                                " " +
                                (slots.find((s) => s.id === id)?.name || id)
                              }
                              value={roles[side]?.[id] || ""}
                              disabled={!editable || busy}
                              onChange={async (e) => {
                                const value = e.target.value;
                                setBusy(true);
                                try {
                                  await save({
                                    ...event,
                                    data: {
                                      ...event.data,
                                      lineupRoles: {
                                        ...roles,
                                        [side]: { ...roles[side], [id]: value },
                                      },
                                    },
                                  });
                                } finally {
                                  setBusy(false);
                                }
                              }}
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
                                    roles[side] || {},
                                  ).some(([p, v]) => p !== id && v === role)}
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
              <button
                onClick={() =>
                  download("composition-" + event.title, {
                    match: event.title,
                    date: event.data.start,
                    map: event.data.lineupMap,
                    players: event.data.lineup.map((id: string) => ({
                      name: slots.find((s) => s.id === id)?.name,
                      roles: { T: roles.T?.[id], CT: roles.CT?.[id] },
                    })),
                  })
                }
              >
                Exporter la composition
              </button>
            </>
          )}
        </>
      )}
      {status && (
        <p role="status" className="fine">
          {status}
        </p>
      )}
    </section>
  );
}
