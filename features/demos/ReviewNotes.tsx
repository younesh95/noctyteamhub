"use client";
import { useState } from "react";
import type { Row } from "../../lib/domain/model";
export const categories = [
  "Communication",
  "Placement",
  "Utilitaires",
  "Trade",
  "Aim",
  "Timing",
];
export default function ReviewNotes({
  row,
  players,
  save,
  editable,
  rows = [],
}: {
  row: Row;
  players: any[];
  save: (r: Row) => Promise<boolean>;
  editable: boolean;
  rows?: Row[];
}) {
  const [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("Tous"),
    [message, setMessage] = useState("");
  const notes = row.data.notes || [];
  async function update(index: number, patch: any) {
    return save({
      ...row,
      data: {
        ...row.data,
        notes: notes.map((n: any, i: number) =>
          i === index ? { ...n, ...patch } : n,
        ),
      },
    });
  }
  async function exercise(n: any, i: number) {
    const sourceNote = n.id || row.id + ":" + i;
    const existing = rows.find(
      (r) => r.kind === "gamesense" && r.data.sourceNote === sourceNote,
    );
    if (existing) {
      setMessage("Cet exercice existe déjà dans GameSense upgrader.");
      return;
    }
    setBusy(true);
    try {
      const id = crypto.randomUUID();
      if (
        await save({
          id,
          kind: "gamesense",
          scope: "team",
          title: (
            "Exercice · " +
            (n.category || "Review") +
            " · " +
            row.title
          ).slice(0, 150),
          body: `Point observé : ${n.text}\nObjectif : ${n.goal || "Corriger cette situation et revoir le résultat lors du prochain entraînement."}\nRepère : round ${n.round}, ${n.time} restantes.`,
          map: row.map,
          data: {
            sourceDemo: row.id,
            sourceNote,
            player: n.player,
            category: n.category,
            goal: n.goal,
            status: "À travailler",
          },
        })
      ) {
        await update(i, { exerciseId: id });
        setMessage("Exercice créé dans Micro → GameSense upgrader.");
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="notes">
      <h3>Review par round</h3>
      <label>
        Filtrer les remarques
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>Tous</option>
          <option>À travailler</option>
          <option>Corrigé</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <div className="review-summary">
        {categories.map((c) => {
          const count = notes.filter(
            (n: any) => n.category === c && n.status !== "Corrigé",
          ).length;
          return count >= 2 ? (
            <span className="badge" key={c}>
              {c} : {count} points à travailler
            </span>
          ) : null;
        })}
      </div>
      {notes.map(
        (n: any, i: number) =>
          (filter === "Tous" ||
            n.category === filter ||
            (n.status || "À travailler") === filter) && (
            <article className="review-note" key={n.id || i}>
              <span className="badge">
                R{n.round} · {n.time} restantes
              </span>{" "}
              <span className="fine">
                {n.category || "Review"} · @
                {players.find((p) => p.id === n.player)?.username || "Équipe"}
              </span>
              <p>{n.text}</p>
              {n.goal && <p className="fine">Objectif : {n.goal}</p>}
              <span className="badge">{n.status || "À travailler"}</span>
              {editable && (
                <div className="board-actions">
                  <button
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await update(i, {
                          status:
                            n.status === "Corrigé" ? "À travailler" : "Corrigé",
                        });
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {n.status === "Corrigé" ? "Rouvrir" : "Marquer corrigé"}
                  </button>
                  {["demo", "personal-demo"].includes(row.kind) &&
                    row.scope !== "personal" && (
                      <button
                        disabled={
                          busy ||
                          !!n.exerciseId ||
                          rows.some(
                            (r) =>
                              r.data.sourceNote === (n.id || row.id + ":" + i),
                          )
                        }
                        onClick={() => exercise(n, i)}
                      >
                        {n.exerciseId ? "Exercice créé" : "Créer un exercice"}
                      </button>
                    )}
                </div>
              )}
            </article>
          ),
      )}
      {editable && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              f = Object.fromEntries(new FormData(form));
            const [m, s] = String(f.time).split(":").map(Number);
            if (m * 60 + s > 135) {
              setMessage(
                "Le temps restant doit être compris entre 0:00 et 2:15.",
              );
              return;
            }
            setBusy(true);
            try {
              if (
                await save({
                  ...row,
                  data: {
                    ...row.data,
                    notes: [
                      ...notes,
                      { ...f, id: crypto.randomUUID(), status: "À travailler" },
                    ],
                  },
                })
              ) {
                form.reset();
                setMessage("Note ajoutée.");
              }
            } finally {
              setBusy(false);
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
              Temps restant
              <input
                name="time"
                placeholder="1:20"
                pattern="[0-2]:[0-5][0-9]"
                required
              />
            </label>
          </div>
          <div className="two">
            <label>
              Joueur
              <select name="player">
                <option value="">Équipe entière</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.username}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Catégorie
              <select name="category">
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Remarque
            <textarea name="text" maxLength={2000} required />
          </label>
          <label>
            Objectif d’entraînement
            <textarea
              name="goal"
              maxLength={1000}
              placeholder="Ex. : réussir 10 reprises de site avec un trade en moins de 2 secondes."
            />
          </label>
          <button disabled={busy}>
            {busy ? "Enregistrement…" : "Ajouter une note"}
          </button>
        </form>
      )}
      {message && (
        <p role="status" className="fine">
          {message}
        </p>
      )}
      <p className="fine">
        Repères de review saisis manuellement. Ouvrez la démo dans CS2 ou
        DemoQuery pour consulter le round.
      </p>
    </div>
  );
}
