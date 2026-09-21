-- Sistema de moedas APOLO: wallet + wallet_transactions (ledger) e uma função
-- transacional que concede moeda ao concluir um dia do protocolo de 30 dias,
-- de forma idempotente (nunca recompensa duas vezes o mesmo dia).
-- ATENÇÃO: esta migration ainda NÃO foi aplicada ao banco remoto (mesma
-- observação da migration anterior do scanner).

CREATE TABLE public.wallet (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet TO authenticated;
GRANT ALL ON public.wallet TO service_role;
ALTER TABLE public.wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet own read" ON public.wallet FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Sem policy de INSERT/UPDATE para authenticated de propósito: o saldo só
-- muda através da função complete_challenge_day (SECURITY DEFINER), nunca
-- por escrita direta do cliente.

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount integer NOT NULL CHECK (amount > 0),
  source text NOT NULL CHECK (source IN ('daily_challenge', 'streak_bonus', 'achievement', 'manual', 'purchase')),
  source_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- NULLs em source_id não colidem entre si no Postgres, então fontes sem
  -- source_id (ex.: 'manual') continuam podendo repetir; apenas transações
  -- com o mesmo (user, source, source_id) — ex.: o mesmo dia do desafio —
  -- ficam bloqueadas de conceder recompensa duas vezes.
  UNIQUE (user_id, source, source_id)
);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet transactions own read" ON public.wallet_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX wallet_transactions_user_created_idx ON public.wallet_transactions (user_id, created_at DESC);

-- "Dia concluído", para fins de recompensa, reaproveita o conceito já
-- existente de protocol_progress (o mesmo usado pela página /protocolo) —
-- não inventei uma regra nova. A função abaixo substitui o INSERT direto
-- que o cliente fazia em protocol_progress para o caminho "done: true":
-- agora completar um dia e conceder a moeda acontecem na mesma transação
-- (implícita em toda função plpgsql), então nunca ficam dessincronizados,
-- e o UNIQUE de protocol_progress(user_id, day_number) + o UNIQUE acima
-- garantem que repetir a chamada para o mesmo dia é inofensivo (idempotente).
CREATE OR REPLACE FUNCTION public.complete_challenge_day(_day_number integer)
RETURNS TABLE (day_completed boolean, coins_awarded integer, new_balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _reward_amount CONSTANT integer := 10;
  _newly_completed boolean := false;
  _awarded integer := 0;
  _balance integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _day_number NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'Invalid day_number';
  END IF;

  INSERT INTO public.protocol_progress (user_id, day_number)
  VALUES (_user_id, _day_number)
  ON CONFLICT (user_id, day_number) DO NOTHING;
  _newly_completed := FOUND;

  IF _newly_completed THEN
    INSERT INTO public.wallet_transactions (user_id, type, amount, source, source_id)
    VALUES (_user_id, 'credit', _reward_amount, 'daily_challenge', _day_number::text)
    ON CONFLICT (user_id, source, source_id) DO NOTHING;

    IF FOUND THEN
      _awarded := _reward_amount;
      INSERT INTO public.wallet (user_id, balance)
      VALUES (_user_id, _reward_amount)
      ON CONFLICT (user_id) DO UPDATE
        SET balance = public.wallet.balance + _reward_amount, updated_at = now();
    END IF;
  END IF;

  SELECT balance INTO _balance FROM public.wallet WHERE user_id = _user_id;
  RETURN QUERY SELECT _newly_completed, _awarded, coalesce(_balance, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_challenge_day(integer) TO authenticated;
