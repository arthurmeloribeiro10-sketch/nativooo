import { useCallback, useEffect, useState } from "react";

/**
 * Lembretes — dois horários (abrir o dia e fechar o dia). A preferência
 * fica no aparelho, e a notificação dispara pelo navegador enquanto o Apolo
 * estiver aberto (inclusive instalado como app na tela inicial).
 */

export type ReminderKind = "morning" | "evening";

export type ReminderPrefs = Record<ReminderKind, { enabled: boolean; time: string }>;

export const REMINDER_COPY: Record<ReminderKind, { label: string; hint: string; body: string }> = {
  morning: {
    label: "Abrir o dia",
    hint: "Um toque de manhã para escolher sua intenção e ver as missões.",
    body: "Bom dia. Suas missões de hoje já estão esperando.",
  },
  evening: {
    label: "Fechar o dia",
    hint: "Um lembrete à noite para registrar o que rolou.",
    body: "Antes de dormir: o que entrou no seu dia?",
  },
};

const DEFAULT_PREFS: ReminderPrefs = {
  morning: { enabled: false, time: "08:00" },
  evening: { enabled: false, time: "21:00" },
};

function key(userId: string) {
  return `apolo:reminders:${userId}`;
}

function read(userId: string): ReminderPrefs {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw
      ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<ReminderPrefs>) }
      : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function useReminderPrefs(userId: string | undefined) {
  const [prefs, setPrefs] = useState<ReminderPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    if (!userId) return;
    setPrefs(read(userId));
  }, [userId]);

  const update = useCallback(
    (kind: ReminderKind, patch: Partial<ReminderPrefs[ReminderKind]>) => {
      if (!userId) return;
      setPrefs((current) => {
        const next = { ...current, [kind]: { ...current[kind], ...patch } };
        try {
          localStorage.setItem(key(userId), JSON.stringify(next));
        } catch {
          /* sem storage */
        }
        return next;
      });
    },
    [userId],
  );

  return { prefs, update };
}

function firedKey(userId: string, kind: ReminderKind, day: string) {
  return `apolo:reminders:fired:${userId}:${day}:${kind}`;
}

/** Enquanto o app está aberto, confere a cada 30 s se algum lembrete venceu. */
export function useReminderScheduler(userId: string | undefined) {
  useEffect(() => {
    if (!userId || !notificationsSupported()) return;

    const check = () => {
      if (Notification.permission !== "granted") return;
      const prefs = read(userId);
      const now = new Date();
      const day = now.toLocaleDateString("en-CA");
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      (Object.keys(prefs) as ReminderKind[]).forEach((kind) => {
        const pref = prefs[kind];
        if (!pref.enabled || pref.time !== hhmm) return;
        const marker = firedKey(userId, kind, day);
        try {
          if (localStorage.getItem(marker)) return;
          localStorage.setItem(marker, "1");
        } catch {
          /* segue sem marcador */
        }
        try {
          new Notification("Apolo", { body: REMINDER_COPY[kind].body, icon: "/icon-192.png" });
        } catch {
          /* alguns navegadores só notificam via service worker */
        }
      });
    };

    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [userId]);
}
