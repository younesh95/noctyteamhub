"use client";
import { useEffect, useState } from "react";
export default function UpdateNotice() {
  const [open, setOpen] = useState(false),
    [offer, setOffer] = useState<any>(null),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false),
    [desktop, setDesktop] = useState(false);
  async function check() {
    setBusy(true);
    try {
      const value = await window.noctys!.checkUpdate();
      setOffer(value);
      setStatus(
        value.available
          ? "Une nouvelle version est disponible."
          : "Vous utilisez la dernière version publiée.",
      );
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (window.noctys) {
      setDesktop(true);
      void check();
    }
  }, []);
  if (!desktop) return null;
  return (
    <aside className="update-notice">
      <button onClick={() => setOpen(!open)}>
        {offer?.available
          ? "Nouvelle version " + offer.available
          : "Mises à jour"}
      </button>
      {open && (
        <section className="panel">
          <h3>Mise à jour NOCTYS</h3>
          <p className="fine">
            Version installée : {offer?.current || "Windows"}
          </p>
          <p role="status">{status}</p>
          <button disabled={busy || ready} onClick={check}>
            Vérifier
          </button>
          {offer?.available && !ready && (
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setStatus("Téléchargement et vérification SHA-256 en cours…");
                try {
                  await window.noctys!.downloadUpdate();
                  setReady(true);
                  setStatus(
                    "Fichier vérifié. Enregistrez vos modifications avant de lancer l’installation.",
                  );
                } catch (e) {
                  setStatus((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Télécharger la mise à jour
            </button>
          )}
          {ready && (
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                if (
                  !window.confirm(
                    "Lancer l’assistant de mise à jour et fermer NOCTYS ? Enregistrez vos modifications avant de continuer.",
                  )
                )
                  return;
                setBusy(true);
                try {
                  await window.noctys!.installUpdate();
                } catch (e) {
                  setStatus((e as Error).message);
                  setBusy(false);
                }
              }}
            >
              Installer et fermer NOCTYS
            </button>
          )}
          <p className="fine">
            L’assistant Windows vous guide. Les comptes et données d’équipe sont
            conservés. L’installateur n’est pas signé par un certificat éditeur.
          </p>
        </section>
      )}
    </aside>
  );
}
