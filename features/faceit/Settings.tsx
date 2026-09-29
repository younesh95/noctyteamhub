"use client";
import { useEffect, useState } from "react";
import { keyStatus, setKey, faceit } from "./client";
import { FACEIT_TEAM_ID } from "../../lib/team-connection";
export default function FaceitSettings({
  startup = false,
}: {
  startup?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [configured, setConfigured] = useState(false),
    [value, setValue] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    keyStatus()
      .then((ok) => {
        setConfigured(ok);
        if (startup && !ok && !sessionStorage.getItem("faceit-setup-dismissed"))
          setOpen(true);
      })
      .catch(() => setOpen(true));
  }, [startup]);
  return (
    <>
      <button className="connection-control" onClick={() => setOpen(true)}>
        FACEIT <span className={configured ? "connected-dot" : "offline-dot"} />
      </button>
      {open && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Connexion FACEIT"
          >
            <div className="row">
              <h2>Connecter FACEIT</h2>
              <button
                aria-label="Fermer FACEIT"
                onClick={() => {
                  setOpen(false);
                  sessionStorage.setItem("faceit-setup-dismissed", "1");
                }}
              >
                ✕
              </button>
            </div>
            <p>Importez vos profils, statistiques et matchs publics.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setMessage("");
                try {
                  if (value) {
                    await setKey(value);
                    setValue("");
                    setConfigured(true);
                  }
                  if (FACEIT_TEAM_ID) {
                    await faceit("/teams/" + FACEIT_TEAM_ID);
                    setMessage("Connexion FACEIT validée.");
                  } else setMessage("Clé enregistrée. Renseignez l’ID d’équipe dans Connexion équipe, ou recherchez un joueur dans Stats pour vérifier l’accès.");
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Clé API FACEIT
                <input
                  type="password"
                  autoComplete="off"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={
                    configured
                      ? "Une clé est déjà enregistrée"
                      : "Coller votre clé API"
                  }
                  maxLength={256}
                />
              </label>
              <p className="fine">
                {typeof window !== "undefined" && window.noctys
                  ? "Clé chiffrée par Windows sur ce PC. Elle n’est jamais envoyée à Supabase."
                  : "Aperçu navigateur : clé client-side en mémoire uniquement, perdue au rechargement."}
              </p>
              <a
                href="https://developers.faceit.com/"
                target="_blank"
                rel="noreferrer"
              >
                Créer une clé dans FACEIT App Studio ↗
              </a>
              <div className="row">
                <button
                  className="primary"
                  disabled={busy || (!configured && !value)}
                >
                  {busy ? "Vérification…" : "Enregistrer et tester"}
                </button>
                {configured && (
                  <button
                    type="button"
                    onClick={async () => {
                      await setKey("");
                      setConfigured(false);
                      setMessage("Clé supprimée de ce PC.");
                    }}
                  >
                    Oublier la clé
                  </button>
                )}
              </div>
            </form>
            {message && (
              <p className="notice" role="status">
                {message}
              </p>
            )}
            <p className="fine">
              Le stockage commun des démos utilise votre session NOCTYS,
              indépendamment de FACEIT.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
