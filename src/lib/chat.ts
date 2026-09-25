import { useCallback, useEffect, useState } from "react";

/** Conversa com o Apolo — fica no aparelho, por usuário, para não se perder ao navegar. */

export type ChatMessage = { role: "user" | "assistant"; content: string; at: string };

export const CHAT_SUGGESTIONS = [
  "Posso comer carboidrato à noite?",
  "Café da manhã rápido",
  "Como dormir melhor?",
  "Montar minha semana",
];

export const CHAT_FOLLOW_UPS = [
  "Sim, monta um jantar",
  "Café da manhã rápido",
  "Como dormir melhor?",
  "Montar minha semana",
];

function key(userId: string) {
  return `apolo:chat:${userId}`;
}

export function useChatHistory(userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(key(userId));
      setMessages(raw ? (JSON.parse(raw) as ChatMessage[]) : []);
    } catch {
      setMessages([]);
    }
    setReady(true);
  }, [userId]);

  const persist = useCallback(
    (next: ChatMessage[]) => {
      setMessages(next);
      if (!userId) return;
      try {
        localStorage.setItem(key(userId), JSON.stringify(next.slice(-60)));
      } catch {
        /* sem storage */
      }
    },
    [userId],
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { messages, persist, clear, ready };
}
