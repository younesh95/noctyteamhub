import { useEffect, useRef, useState } from "react";
import { api, refreshSession } from "../../lib/supabase";
import { validFrame } from "./live-policy.mjs";
export function useLiveBoard(frame: any, receive: (frame: any) => void) {
  const [mode, setMode] = useState<"off" | "present" | "follow">("off"),
    [message, setMessage] = useState("");
  const latest = useRef(frame),
    deliver = useRef(receive);
  latest.current = frame;
  deliver.current = receive;
  useEffect(() => {
    if (mode === "off") return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let last = "",
      sent = 0;
    async function tick() {
      try {
        await refreshSession();
        if (!active) return;
        if (mode === "present") {
          const value = JSON.stringify(latest.current);
          if (value !== last || Date.now() - sent > 5000) {
            if (!validFrame(latest.current))
              throw Error("Le tableau contient des repères invalides.");
            const ok = await api("/rest/v1/rpc/present_board", {
              method: "POST",
              body: JSON.stringify({ frame: latest.current }),
            });
            if (!active) return;
            if (!ok) throw Error("Un autre membre présente déjà un tableau.");
            last = value;
            sent = Date.now();
            setMessage(
              "Présentation en direct · les membres peuvent suivre votre tableau.",
            );
          }
        } else {
          const rows = await api(
            "/rest/v1/board_live?id=eq.team&select=updated_at",
          );
          if (!active) return;
          const row = rows[0];
          if (!row || Date.now() - Date.parse(row.updated_at) > 25000) {
            setMessage("En attente d’un présentateur.");
          } else {
            if (last !== row.updated_at) {
              const content = await api(
                "/rest/v1/board_live?id=eq.team&select=state,updated_at",
              );
              if (!active) return;
              if (!content[0]) return;
              if (!validFrame(content[0].state))
                throw Error("Présentation reçue invalide.");
              deliver.current(content[0].state);
              last = content[0].updated_at;
            }
            setMessage("Vous suivez le tableau du présentateur.");
          }
        }
      } catch (e) {
        if (active) {
          setMessage(
            (e as Error).message +
              " Vérifiez la connexion et la migration 005.",
          );
          setMode("off");
        }
      } finally {
        if (active) timer = setTimeout(tick, mode === "present" ? 750 : 1000);
      }
    }
    tick();
    return () => {
      active = false;
      clearTimeout(timer);
      if (mode === "present")
        void api("/rest/v1/rpc/present_board", {
          method: "POST",
          body: JSON.stringify({ frame: null }),
        }).catch(() => {});
    };
  }, [mode]);
  return { mode, setMode, message };
}
