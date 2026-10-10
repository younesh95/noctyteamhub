"use client";
import { useRef, useState } from "react";
import { api, SUPABASE_URL, SUPABASE_KEY } from "../../lib/supabase";
export default function AccountRecovery({ close }: { close: () => void }) {
  const [email, setEmail] = useState(""),
    [step, setStep] = useState("email"),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const token = useRef("");
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setStatus("");
    try {
      await action();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="recovery-page">
      <section className="panel">
        <span className="eyebrow">ACCÈS AU COMPTE</span>
        <h1>Réinitialiser mon mot de passe</h1>
        {step === "email" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await api("/auth/v1/recover", {
                  method: "POST",
                  body: JSON.stringify({ email: email.trim() }),
                });
                setStep("code");
                setStatus(
                  "Si cette adresse correspond à un compte, un email de récupération est envoyé.",
                );
              });
            }}
          >
            <label>
              Adresse email du compte
              <input
                type="email"
                required
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button className="primary" disabled={busy}>
              Recevoir un code de récupération
            </button>
          </form>
        )}
        {step === "code" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void run(async () => {
                const d = await api("/auth/v1/verify", {
                  method: "POST",
                  body: JSON.stringify({
                    email: email.trim(),
                    token: String(f.get("code")).trim(),
                    type: "recovery",
                  }),
                });
                if (!d.access_token) throw Error("Code invalide ou expiré.");
                token.current = d.access_token;
                setStep("password");
              });
            }}
          >
            <p>
              Recopiez le code reçu par email. Regardez aussi dans les spams.
            </p>
            <label>
              Code de récupération
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                minLength={6}
                maxLength={10}
                required
              />
            </label>
            <button disabled={busy} className="primary">
              Vérifier le code
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep("email");
                setStatus("");
              }}
            >
              Renvoyer un code / changer d’adresse
            </button>
            <p className="fine">
              Si votre email ne contient qu’un lien, demandez au coach d’activer
              le modèle d’email avec code fourni avec cette version.
            </p>
          </form>
        )}
        {step === "password" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (f.get("password") !== f.get("confirm")) {
                setStatus("Les deux mots de passe doivent être identiques.");
                return;
              }
              void run(async () => {
                const headers = {
                  apikey: SUPABASE_KEY,
                  Authorization: "Bearer " + token.current,
                  "Content-Type": "application/json",
                };
                const r = await fetch(SUPABASE_URL + "/auth/v1/user", {
                  method: "PUT",
                  redirect: "error",
                  headers,
                  body: JSON.stringify({ password: f.get("password") }),
                });
                if (!r.ok)
                  throw Error(
                    "Modification refusée ou code expiré. Recommencez la récupération.",
                  );
                await fetch(SUPABASE_URL + "/auth/v1/logout?scope=global", {
                  method: "POST",
                  redirect: "error",
                  headers,
                }).catch(() => {});
                token.current = "";
                sessionStorage.removeItem("noctys-session");
                setStep("done");
              });
            }}
          >
            <label>
              Nouveau mot de passe
              <input
                name="password"
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              Confirmer
              <input
                name="confirm"
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </label>
            <button disabled={busy} className="primary">
              Enregistrer le nouveau mot de passe
            </button>
          </form>
        )}
        {step === "done" && (
          <p>
            Mot de passe modifié. Connectez-vous avec votre pseudo et votre
            nouveau mot de passe.
          </p>
        )}
        {status && <p role="status">{status}</p>}
        <button
          disabled={busy}
          onClick={() => {
            token.current = "";
            close();
          }}
        >
          Retour à la connexion
        </button>
      </section>
    </main>
  );
}
