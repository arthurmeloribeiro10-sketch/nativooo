import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

// wallet/wallet_transactions/complete_challenge_day existem só na migration
// supabase/migrations/20260920090000_*.sql — ainda não aplicada ao projeto
// remoto nem presente no `Database` gerado. Mesma observação do scanner:
// depois de aplicar a migration, rode `supabase gen types typescript` de
// novo e troque este cast por tipagem normal.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useWalletBalance(userId: string | undefined) {
  return useQuery({
    queryKey: ["wallet", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<number> => {
      const { data, error } = await db
        .from("wallet")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data?.balance ?? 0;
    },
  });
}

export type CompleteChallengeDayResult = {
  dayCompleted: boolean;
  coinsAwarded: number;
  newBalance: number;
};

/**
 * Conclui um dia do desafio de 30 dias. Reaproveita protocol_progress (já
 * existente) como a definição de "dia concluído" — a função no banco só
 * roda o INSERT e a concessão de moedas dentro da mesma transação, então
 * chamar duas vezes para o mesmo dia nunca concede moeda em dobro.
 */
export function useCompleteChallengeDay(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dayNumber: number): Promise<CompleteChallengeDayResult> => {
      const { data, error } = await db
        .rpc("complete_challenge_day", { _day_number: dayNumber })
        .single();
      if (error) throw error;
      return {
        dayCompleted: data.day_completed,
        coinsAwarded: data.coins_awarded,
        newBalance: data.new_balance,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet", userId] });
      qc.invalidateQueries({ queryKey: ["protocol", userId] });
    },
  });
}
