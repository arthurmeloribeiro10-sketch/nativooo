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
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
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

    if (!res.ok) {
      const failure = (await res.json().catch(() => null)) as { message?: string } | null;
      if (res.status === 429)
        throw new Error(failure?.message || "Muitos pedidos agora. Aguarde e tente novamente.");
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

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("A IA não retornou uma resposta.");
    return { reply };
  });
