"use client";
import { useEffect, useState } from "react";
import { Row } from "../../lib/domain/model";
export default function TeamCall({
  visible,
  rows,
  save,
  editable,
  demo,
}: {
  visible: boolean;
  rows: Row[];
  save: (r: Row) => Promise<boolean>;
  editable: boolean;
  demo: boolean;
}) {
  const [room, setRoom] = useState(""),
    [attempt, setAttempt] = useState(0),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  const rooms = rows.filter((r) => r.kind === "call");
  useEffect(
    () => () => {
      void window.noctys?.callActive(false);
    },
    [],
  );
  async function join(name: string) {
    if (!/^noctys-[a-f0-9-]{36}$/.test(name)) {
      setStatus("Salon invalide.");
      return;
    }
    setBusy(true);
    try {
      await window.noctys?.callActive(true);
      setRoom(name);
      setStatus("");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function create() {
    setBusy(true);
    try {
      const name = "noctys-" + crypto.randomUUID();
      const ok = await save({
        id: crypto.randomUUID(),
        kind: "call",
        scope: "team",
        title: "Appel du " + new Date().toLocaleString("fr-FR"),
        body: "",
        data: { room: name },
      });
      setStatus(
        ok
          ? "Salon créé. Les membres peuvent le rejoindre."
          : "Création impossible. Vérifiez la migration 003.",
      );
    } finally {
      setBusy(false);
    }
  }
  function leave() {
    setRoom("");
    void window.noctys?.callActive(false);
  }
  if (!visible && !room) return null;
  return (
    <section
      className={visible ? "panel team-call" : "panel team-call call-dock"}
    >
      <div className="row">
        <div>
          <span className="eyebrow">JITSI / TEAM CALL</span>
          <h3>{room ? "Appel d’équipe ouvert" : "Se retrouver en vocal"}</h3>
        </div>
        {room && <button onClick={leave}>Quitter l’appel</button>}
      </div>
      {!room ? (
        <>
          <p>
            Micro, caméra et partage de la fenêtre NOCTYS. L’appel reste ouvert
            pendant la navigation dans les autres onglets.
          </p>
          <p className="fine">
            L’organisateur peut devoir se connecter à Jitsi pour démarrer le
            salon. Activez le lobby ou un mot de passe dans Jitsi : les droits
            Supabase ne protègent pas l’accès à un lien Jitsi partagé.
          </p>
          {demo && (
            <p className="fine">
              Les salons créés en mode démonstration ne sont pas synchronisés
              avec les autres membres.
            </p>
          )}
          {editable && (
            <button className="primary" disabled={busy} onClick={create}>
              ＋ Créer un salon d’équipe
            </button>
          )}
          <div className="call-rooms">
            {rooms.map((r) => (
              <div className="row" key={r.id}>
                <span>{r.title}</span>
                <button disabled={busy} onClick={() => join(r.data.room)}>
                  Rejoindre
                </button>
              </div>
            ))}
          </div>
          {!rooms.length && (
            <p className="fine">
              Le coach ou l’analyste peut créer le premier salon.
            </p>
          )}
        </>
      ) : (
        <>
          <iframe
            key={room + attempt}
            title="Appel Jitsi NOCTYS"
            src={
              "https://meet.jit.si/" +
              room +
              "#config.prejoinConfig.enabled=true&config.startWithAudioMuted=true&config.startWithVideoMuted=true"
            }
            allow="camera; microphone; display-capture; fullscreen; autoplay"
            allowFullScreen
            referrerPolicy="no-referrer"
          />
          <p className="fine">
            Dans Jitsi, utilisez « Partager votre écran ». Sous Windows, NOCTYS
            propose uniquement sa propre fenêtre, après confirmation.
          </p>
          {visible && (
            <div className="board-actions">
              <button onClick={() => setAttempt((n) => n + 1)}>
                Recharger Jitsi
              </button>
              <a
                href={"https://meet.jit.si/" + room}
                target="_blank"
                rel="noreferrer"
              >
                Ouvrir le salon dans le navigateur
              </a>
            </div>
          )}
        </>
      )}
      <p className="fine" role="status">
        {status}
      </p>
    </section>
  );
}
