import { useCallback, useEffect, useState } from "react";

/**
 * Apollo Pro — enquanto não existe cobrança integrada, o teste grátis de
 * 7 dias fica registrado no aparelho (por usuário). A interface do paywall é
 * a única que escreve aqui; trocar por assinatura real é trocar este arquivo.
 */

export const TRIAL_DAYS = 7;
/** Texto exibido no paywall. Ajustar quando o preço anual for definido. */
export const ANNUAL_PRICE_LABEL = "[PREÇO]";

type ProState = { trialStartedAt?: string };

function key(userId: string) {
  return `apolo:pro:${userId}`;
}

function read(userId: string): ProState {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as ProState) : {};
  } catch {
    return {};
  }
}

export function useProStatus(userId: string | undefined) {
  const [state, setState] = useState<ProState>({});

  useEffect(() => {
    if (!userId) return;
    setState(read(userId));
  }, [userId]);

  const startTrial = useCallback(() => {
    if (!userId) return;
    const next = { trialStartedAt: new Date().toISOString() };
    try {
      localStorage.setItem(key(userId), JSON.stringify(next));
    } catch {
      /* sem storage — vale só nesta sessão */
    }
    setState(next);
  }, [userId]);

  const startedAt = state.trialStartedAt ? new Date(state.trialStartedAt) : null;
  const elapsedDays = startedAt
    ? Math.floor((Date.now() - startedAt.getTime()) / 86_400_000)
    : null;
  const daysLeft = elapsedDays === null ? null : Math.max(0, TRIAL_DAYS - elapsedDays);
  const trialActive = daysLeft !== null && daysLeft > 0;

  return { trialActive, daysLeft, startedAt, startTrial };
}
