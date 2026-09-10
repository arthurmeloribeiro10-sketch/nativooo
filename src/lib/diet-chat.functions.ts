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
});

export const askRayPeatCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<{ reply: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("IA indisponível no momento.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista na abordagem pró-metabólica de Ray Peat. Responda dúvidas sobre alimentos, tireoide, energia, açúcar, leite, gorduras saturadas, óleos poliinsaturados, luz solar, estresse e digestão dentro dessa visão. Fale em português do Brasil, de forma simples, calorosa e prática, com respostas curtas (até 6 linhas) e exemplos de comida brasileira. Não faça diagnóstico médico; lembre a pessoa de procurar um profissional quando for algo clínico.",
          },
          ...data.messages,
        ],
      }),
    });

    if (res.status === 429) throw new Error("Muitos pedidos agora. Tente de novo em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!res.ok) throw new Error("Não consegui responder agora.");

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("A IA não retornou uma resposta.");
    return { reply };
  });
