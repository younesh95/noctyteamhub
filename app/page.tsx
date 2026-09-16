"use client";
import { useEffect, useState } from "react";
import FaceitSettings from "../features/faceit/Settings";
import PasswordRecovery from "./password-recovery";
import { ArrowUpRight, Shield, Users, ChevronRight } from "lucide-react";
import { api, auth } from "../lib/supabase";
export default function Home() {
  const [recover, setRecover] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.get("type") === "recovery" || p.has("error_code")) setRecover(true);
  }, []);
  const [mode, setMode] = useState("signup"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [confirmationEmail, setConfirmationEmail] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = Object.fromEntries(new FormData(e.currentTarget));
      await auth(mode, f);
      if (mode === "signup") {
        setConfirmationEmail(String(f.email || ""));
        setError(
          "Consultez votre email, y compris les spams, pour confirmer votre compte. Votre accès sera ensuite validé par le staff.",
        );
      } else location.href = "/workspace";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (recover) return <PasswordRecovery />;
  return (
    <main className="auth">
      <section className="auth-art">
        <a className="brand">
          <img src="/noctys.png" alt="" />
          <span>
            NOCTYS<small>TEAM HEADQUARTERS</small>
          </span>
        </a>
        <div className="auth-emblem">
          <img src="/noctys.png" alt="Logo NOCTYS E-sports" />
        </div>
        <div className="auth-copy">
          <span className="eyebrow">COUNTER-STRIKE 2 · TEAM WORKSPACE</span>
          <h1>
            Un collectif.
            <br />
            Une longueur d’avance.
          </h1>
          <p>
            Préparez vos rounds. Affinez votre jeu.
            <br />
            Construisez la prochaine victoire, ensemble.
          </p>
        </div>
        <footer>
          <span>MACRO GAMEPLAY</span>
          <span>MICRO GAMEPLAY</span>
          <span>NOCTYS E-SPORTS © 2026</span>
        </footer>
      </section>
      <section className="auth-form">
        <div className="auth-top">
          <FaceitSettings startup />
          <Shield size={16} /> Espace privé de l’équipe
        </div>
        <div className="auth-inner">
          <span className="eyebrow">BIENVENUE CHEZ NOCTYS</span>
          <h2>
            {mode === "signup"
              ? "Rejoindre le collectif."
              : "Bon retour parmi nous."}
          </h2>
          <p className="muted">
            Votre équipe. Vos stratégies. Votre progression.
          </p>
          <div className="tabs">
            <button
              className={mode === "signup" ? "selected" : ""}
              onClick={() => {
                setMode("signup");
                setError("");
              }}
            >
              Créer un compte
            </button>
            <button
              className={mode === "login" ? "selected" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Se connecter
            </button>
          </div>
          <form onSubmit={submit}>
            <label>
              Nom d’utilisateur
              <input
                name="username"
                required
                minLength={3}
                pattern="[a-zA-Z0-9_-]{3,24}"
                placeholder="Votre pseudo"
              />
            </label>
            {mode === "signup" && (
              <label>
                Adresse email
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="vous@exemple.fr"
                />
              </label>
            )}
            <label>
              Mot de passe
              <input
                name="password"
                type="password"
                required
                minLength={10}
                placeholder="10 caractères minimum"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
              />
            </label>
            {mode === "signup" && (
              <div className="two">
                <label>
                  Pseudo FACEIT
                  <input
                    name="faceit"
                    required
                    placeholder="Votre pseudo FACEIT"
                  />
                </label>
                <label>
                  Votre rôle
                  <select name="role">
                    <option value="joueur">Joueur</option>
                    <option value="IGL">IGL</option>
                    <option value="coach">Coach</option>
                    <option value="analyste">Analyste</option>
                  </select>
                </label>
              </div>
            )}
            <button disabled={busy} className="primary wide">
              {busy
                ? "Connexion…"
                : mode === "signup"
                  ? "Créer mon compte"
                  : "Se connecter"}
              <ArrowUpRight size={18} />
            </button>
          </form>
          {error && (
            <p className="notice" role="status">
              {error}
            </p>
          )}
          {mode === "signup" && confirmationEmail && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api("/auth/v1/resend", {
                    method: "POST",
                    body: JSON.stringify({
                      type: "signup",
                      email: confirmationEmail,
                    }),
                  });
                  setError("Email de confirmation redemandé. Vérifiez aussi les spams.");
                } catch (cause) {
                  setError((cause as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Renvoyer l’email de confirmation
            </button>
          )}
          <p className="fine">
            Les accès et les rôles sont validés par le staff NOCTYS.
          </p>
          <a className="explore" href="/workspace?demo=1">
            Explorer l’espace de démonstration <ChevronRight size={16} />
          </a>
        </div>
        <div className="auth-bottom">
          <Users size={16} /> Pensé pour les cinq. Construit pour l’équipe.
        </div>
      </section>
    </main>
  );
}
