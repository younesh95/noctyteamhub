"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  loadConnection,
  saveConnection,
  type TeamConnection,
} from "../../lib/team-connection";
import { validateConnection } from "../../desktop/connection-policy.mjs";
export default function ConnectionGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false),
    [configured, setConfigured] = useState(false),
    [editing, setEditing] = useState(false);
  const [config, setConfig] = useState<TeamConnection>({
    supabaseUrl: "",
    publishableKey: "",
    faceitTeamId: "",
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const demo =
    typeof location !== "undefined" &&
    new URLSearchParams(location.search).get("demo") === "1";
  useEffect(() => {
    let active = true;
    loadConnection().then((c) => {
      if (!active) return;
      if (c) {
        setConfig(c);
        setConfigured(true);
      }
      setReady(true);
    });
    const edit = () => setEditing(true);
    window.addEventListener("noctys:connection-settings", edit);
    return () => {
      active = false;
      window.removeEventListener("noctys:connection-settings", edit);
    };
  }, []);
  if (!ready)
    return (
      <main className="auth">
        <section className="panel">Chargement de la configuration…</section>
      </main>
    );
  if ((configured || demo) && !editing) return children;
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <section className="panel" style={{ maxWidth: 620, width: "100%" }}>
        <a className="brand">
          <img src="/noctys.png" alt="" />
          NOCTYS HQ
        </a>
        <h1 style={{ marginTop: 24 }}>Connecter votre équipe</h1>
        <p>
          L’installateur public ne contient aucune configuration d’équipe.
          Importez le fichier de connexion transmis par votre coach, puis
          connectez-vous avec votre compte personnel.
        </p>
        <label>
          Importer le fichier de connexion
          <input
            type="file"
            accept="application/json,.json"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 4096) throw Error("Fichier trop volumineux.");
                setConfig(validateConnection(JSON.parse(await file.text())));
                setError("");
              } catch (cause) {
                setError((cause as Error).message);
              }
              e.target.value = "";
            }}
          />
        </label>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await saveConnection(config);
              location.href = "/";
            } catch (cause) {
              setError((cause as Error).message);
              setBusy(false);
            }
          }}
        >
          <label>
            URL Supabase de l’équipe
            <input
              required
              type="url"
              disabled={busy}
              value={config.supabaseUrl}
              placeholder="https://votre-projet.supabase.co"
              onChange={(e) =>
                setConfig({ ...config, supabaseUrl: e.target.value })
              }
            />
          </label>
          <label>
            Clé publique publishable
            <input
              required
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
              value={config.publishableKey}
              placeholder="sb_publishable_…"
              onChange={(e) =>
                setConfig({ ...config, publishableKey: e.target.value })
              }
            />
          </label>
          <label>
            ID d’équipe FACEIT (facultatif)
            <input
              disabled={busy}
              value={config.faceitTeamId}
              onChange={(e) =>
                setConfig({ ...config, faceitTeamId: e.target.value })
              }
            />
          </label>
          <p className="fine">
            Vérifiez l’adresse du projet avant de continuer. Ce fichier ne doit
            contenir ni mot de passe ni clé secrète. La configuration reste sur
            ce PC. Changer d’équipe déconnecte la session actuelle.
          </p>
          {error && <p role="alert">{error}</p>}
          <button className="primary" disabled={busy}>
            {busy ? "Enregistrement…" : "Enregistrer la connexion"}
          </button>
          {(configured || demo) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Annuler
            </button>
          )}
        </form>
        {!configured && (
          <a className="link-button" href="/workspace?demo=1">
            Explorer en démonstration
          </a>
        )}
      </section>
    </main>
  );
}
