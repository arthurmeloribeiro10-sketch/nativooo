import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
  context: z
    .object({
      name: z.string().max(60).optional(),
      intention: z.string().max(30).optional(),
      pendingMissions: z.array(z.string().max(120)).max(10).optional(),
      mealsToday: z.array(z.string().max(160)).max(10).optional(),
    })
    .optional(),
});

const PERSONA = `Você é o Apolo, um guia de nutrição e rotina: leve, direto e sem neura.
Fale em português do Brasil, com frases curtas e no máximo três parágrafos curtos.
Seu foco: comida de verdade, sono, sol, movimento e presença (menos telas).
Você não conta calorias, não prescreve dietas restritivas, não usa culpa e não faz diagnóstico.
Quando o assunto for clínico (doença, remédio, sintoma persistente), oriente a procurar um profissional de saúde.
Use exemplos de comida brasileira simples (arroz, feijão, ovo, batata, mandioca, frutas).
Quando fizer sentido, termine com uma pergunta curta oferecendo o próximo passo prático.
Sem emojis, sem listas longas, sem markdown.`;

function describeContext(context: z.infer<typeof inputSchema>["context"]) {
  if (!context) return "";
  const parts: string[] = [];
  if (context.name) parts.push(`Nome da pessoa: ${context.name}.`);
  if (context.intention) parts.push(`Intenção escolhida para hoje: ${context.intention}.`);
  if (context.pendingMissions?.length)
    parts.push(`Missões ainda pendentes hoje: ${context.pendingMissions.join("; ")}.`);
  if (context.mealsToday?.length)
    parts.push(`O que a pessoa já registrou hoje: ${context.mealsToday.join("; ")}.`);
  return parts.length ? `\n\nContexto do dia (use só se ajudar):\n${parts.join("\n")}` : "";
}

export const askApolo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<{ reply: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("O Apolo está sem conexão com a IA agora. Tente mais tarde.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: PERSONA + describeContext(data.context) },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      const failure = (await res.json().catch(() => null)) as { message?: string } | null;
      if (res.status === 429)
        throw new Error(
          failure?.message || "Muitas perguntas agora. Espere um instante e tente de novo.",
        );
      if (res.status === 402)
        throw new Error(
          failure?.message ||
            "Os créditos de IA acabaram. O responsável pelo app precisa adicionar créditos.",
        );
      if (res.status === 403)
        throw new Error(failure?.message || "A IA está indisponível por uma regra do espaço.");
      if (res.status === 401) throw new Error("A IA não está configurada corretamente.");
      throw new Error(failure?.message || "Não consegui responder agora.");
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("A IA não retornou uma resposta.");
    return { reply };
  });
