"use client";

import { useCallback, useEffect, useState } from "react";
import { api, refreshSession } from "../../lib/supabase";

type Role = "joueur" | "IGL" | "coach" | "analyste";
type Member = {
  id: string;
  username: string;
  faceit: string;
  role: Role;
  requested_role: Role;
  active: boolean;
};

const roles: Role[] = ["joueur", "IGL", "coach", "analyste"];

export default function Members({
  demo,
  onApproved,
}: {
  demo: boolean;
  onApproved: () => Promise<void>;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [choices, setChoices] = useState<Record<string, Role>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (demo) {
      setMembers([]);
      setLoading(false);
      return;
    }
    try {
      await refreshSession();
      const result = await api(
        "/rest/v1/profiles?select=id,username,faceit,role,requested_role,active&order=created_at.asc",
      );
      setMembers(result);
      setChoices((previous) => {
        const next = { ...previous };
        for (const member of result as Member[])
          next[member.id] ??= member.active
            ? member.role
            : member.requested_role;
        return next;
      });
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }, [demo]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function approve(member: Member) {
    const role = choices[member.id] || member.requested_role;
    if (
      ["coach", "analyste"].includes(role) &&
      !window.confirm(
        `${member.username} aura les droits complets en tant que ${role}. Confirmer ?`,
      )
    )
      return;
    setBusy(member.id);
    setError("");
    try {
      await refreshSession();
      await api("/rest/v1/rpc/approve_member", {
        method: "POST",
        body: JSON.stringify({ member_id: member.id, approved_role: role }),
      });
      await Promise.all([load(), onApproved()]);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy("");
    }
  }

  const pending = members.filter((member) => !member.active);
  const active = members.filter((member) => member.active);
  return (
    <div className="members-management">
      <p className="muted">
        {demo
          ? "Le mode démonstration ne gère pas de comptes réels."
          : `${active.length} membre(s) actif(s) · ${pending.length} en attente`}
      </p>
      <p className="fine">
        Chaque personne crée son compte avec un pseudo et une adresse email
        distincts. Le rôle demandé n’accorde aucun droit avant votre validation.
      </p>
      {error && <p className="notice" role="alert">{error}</p>}
      {loading && <p>Chargement des membres…</p>}
      {!loading && !demo && (
        <>
          <h3>Demandes en attente</h3>
          {pending.length === 0 && <p className="muted">Aucune demande.</p>}
          {pending.map((member) => (
            <div className="member-row" key={member.id}>
              <div>
                <strong>{member.username}</strong>
                <small>FACEIT : {member.faceit || "non renseigné"}</small>
                <small>Rôle demandé : {member.requested_role}</small>
              </div>
              <label>
                Rôle accordé
                <select
                  value={choices[member.id] || member.requested_role}
                  onChange={(event) =>
                    setChoices((current) => ({
                      ...current,
                      [member.id]: event.target.value as Role,
                    }))
                  }
                >
                  {roles.map((role) => <option key={role}>{role}</option>)}
                </select>
              </label>
              <button
                className="primary"
                disabled={Boolean(busy)}
                onClick={() => void approve(member)}
              >
                {busy === member.id ? "Validation…" : "Valider"}
              </button>
            </div>
          ))}
          <h3>Membres actifs</h3>
          {active.map((member) => (
            <div className="member-row" key={member.id}>
              <div>
                <strong>{member.username}</strong>
                <small>{member.faceit || "FACEIT non renseigné"}</small>
              </div>
              <span className="badge">{member.role}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
