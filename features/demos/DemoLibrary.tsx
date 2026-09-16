"use client";
import { useEffect, useRef, useState } from "react";
import { Upload } from "tus-js-client";
import { Row, maps } from "../../lib/domain/model";
import {
  refreshSession,
  session,
  SUPABASE_KEY,
  fileUrl,
} from "../../lib/supabase";
import { Notes } from "../workspace/panels";
export default function DemoLibrary({
  rows,
  players,
  me,
  save,
  demo,
  editable,
}: {
  rows: Row[];
  players: any[];
  me: any;
  save: (r: Row) => Promise<boolean>;
  demo: boolean;
  editable: boolean;
}) {
  const [query, setQuery] = useState(""),
    [map, setMap] = useState("Toutes les maps"),
    [title, setTitle] = useState(""),
    [chosenMap, setChosenMap] = useState("Mirage"),
    [file, setFile] = useState<File | null>(null),
    [progress, setProgress] = useState(0),
    [busy, setBusy] = useState(false),
    [paused, setPaused] = useState(false),
    [message, setMessage] = useState(""),
    [pending, setPending] = useState<Row | null>(null);
  const task = useRef<Upload | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      task.current?.abort();
    };
  }, []);
  async function publish(row: Row) {
    const ok = await save(row);
    if (!alive.current) return;
    if (ok) {
      setPending(null);
      setFile(null);
      setTitle("");
      setMessage("Démo ajoutée à la bibliothèque commune.");
    } else {
      setPending(row);
      setMessage(
        "Fichier transféré, mais fiche non enregistrée. Réessayez la publication ci-dessous.",
      );
    }
    setBusy(false);
  }
  async function upload() {
    if (!file || !title.trim()) return;
    setMessage("");
    if (demo) {
      setMessage(
        "Connectez-vous pour transférer une démo dans le stockage commun.",
      );
      return;
    }
    if (
      !/\.dem$/i.test(file.name) ||
      file.size === 0 ||
      file.size > 500 * 1024 * 1024
    ) {
      setMessage("Sélectionnez une démo .dem non vide de 500 Mo maximum.");
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      await refreshSession();
      if (!session()?.access_token)
        throw Error("Session expirée. Reconnectez-vous.");
      const path =
        me.id +
        "/" +
        crypto.randomUUID() +
        "-" +
        file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const row: Row = {
        id: crypto.randomUUID(),
        kind: "demo",
        scope: "team",
        title: title.trim(),
        body: "Démo commune NOCTYS",
        map: chosenMap,
        data: { file: path, filename: file.name, size: file.size, notes: [] },
      };
      task.current = new Upload(file, {
        endpoint:
          "https://adrleyvcufedeologxnx.storage.supabase.co/storage/v1/upload/resumable",
        headers: {
          authorization: "Bearer " + session().access_token,
          apikey: SUPABASE_KEY,
        },
        chunkSize: 6 * 1024 * 1024,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        storeFingerprintForResuming: false,
        uploadDataDuringCreation: true,
        metadata: {
          bucketName: "team-files",
          objectName: path,
          contentType: "application/octet-stream",
          cacheControl: "3600",
        },
        onBeforeRequest: async (req) => {
          await refreshSession();
          req.setHeader("authorization", "Bearer " + session()?.access_token);
        },
        onProgress: (n, total) => {
          if (alive.current) setProgress(Math.round((n / total) * 100));
        },
        onError: () => {
          if (alive.current) {
            setMessage(
              "Transfert interrompu. Vérifiez votre connexion, les droits et la limite du bucket Supabase. Vous pouvez reprendre.",
            );
            setPaused(true);
          }
        },
        onSuccess: () => {
          if (alive.current) publish(row);
        },
      });
      task.current.start();
    } catch (e) {
      setMessage((e as Error).message);
      setBusy(false);
    }
  }
  const demos = rows.filter(
    (r) =>
      r.kind === "demo" &&
      (map === "Toutes les maps" || r.map === map) &&
      r.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="demo-library">
      <div className="storage-banner">
        <div>
          <span className="connected-dot" />
          <strong>Bibliothèque commune NOCTYS</strong>
          <p>Un espace privé partagé entre les sessions de l’équipe.</p>
        </div>
        <span className="badge">SUPABASE STORAGE · {demos.length} DÉMOS</span>
      </div>
      {editable && (
        <section className="panel">
          <h3>Importer une démo</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              upload();
            }}
          >
            <div className="board-top">
              <label>
                Titre
                <input
                  required
                  maxLength={150}
                  disabled={busy || !!pending}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label>
                Map
                <select
                  disabled={busy || !!pending}
                  value={chosenMap}
                  onChange={(e) => setChosenMap(e.target.value)}
                >
                  {maps.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label>
                Fichier .dem
                <input
                  type="file"
                  accept=".dem"
                  required
                  disabled={busy || !!pending}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <button className="primary" disabled={busy || !!pending || !file}>
              Importer dans l’espace commun
            </button>
          </form>
          {busy && (
            <div className="upload-progress">
              <progress max="100" value={progress} />
              <span>{progress} %</span>
              <button
                onClick={async () => {
                  if (paused) {
                    task.current?.start();
                    setPaused(false);
                  } else {
                    await task.current?.abort();
                    setPaused(true);
                  }
                }}
              >
                {paused ? "Reprendre" : "Pause"}
              </button>
            </div>
          )}
          {pending && (
            <button onClick={() => publish(pending)}>
              Réessayer la publication de la fiche
            </button>
          )}
          <p className="fine">
            Transfert par blocs avec reprise dans cette fenêtre. 500 Mo maximum,
            selon les limites de votre projet Supabase.
          </p>
        </section>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <div className="filters">
        <input
          aria-label="Rechercher une démo"
          placeholder="Rechercher une démo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Map des démos"
          value={map}
          onChange={(e) => setMap(e.target.value)}
        >
          <option>Toutes les maps</option>
          {maps.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="library-grid">
        {demos.map((row) => (
          <article className="panel library-card" key={row.id}>
            <span className="eyebrow">{row.map} · DÉMO COMMUNE</span>
            <h3>{row.title}</h3>
            <p>{row.data.filename || row.body}</p>
            {row.data.size && (
              <small>{(row.data.size / 1048576).toFixed(1)} Mo</small>
            )}
            {row.data.file && (
              <button
                onClick={async () => {
                  try {
                    await refreshSession();
                    const url = await fileUrl(row.data.file);
                    window.open(url, "_blank", "noopener");
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              >
                Télécharger la démo
              </button>
            )}
            <Notes
              row={row}
              players={players}
              save={save}
              editable={editable}
            />
          </article>
        ))}
      </div>
      {!demos.length && (
        <div className="panel empty">
          Aucune démo dans cette sélection. Le staff peut importer les premières
          reviews.
        </div>
      )}
      <p className="fine">
        La lecture 2D n’est pas encore intégrée : téléchargez le fichier pour le
        lire dans CS2 ou DemoQuery.
      </p>
    </div>
  );
}
