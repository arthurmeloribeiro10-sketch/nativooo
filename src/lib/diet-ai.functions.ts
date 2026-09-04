import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  weightKg: z.number().min(25).max(300),
  heightCm: z.number().min(100).max(250),
  goal: z.string().max(120).optional(),
});

export type JungleMeal = {
  time_label: string;
  name: string;
  items: string[];
  kcal: number;
};

export type JungleDiet = {
  meals: JungleMeal[];
  summary: string;
  kcalTotal: number;
};

export const generateJungleDiet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<JungleDiet> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("IA indisponível no momento.");

    const prompt = `Monte uma "dieta da selva" (comida real, ancestral, nada industrializado: carnes, ovos, peixes, frutas, raízes, tubérculos, castanhas, mel, folhas) para uma pessoa de ${data.weightKg} kg e ${data.heightCm} cm.${
      data.goal ? ` Objetivo: ${data.goal}.` : ""
    } Use 4 a 5 refeições com horários em formato "07h30". Ingredientes brasileiros e acessíveis. Responda em português do Brasil.`;

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
              "Você é um nutricionista de estilo ancestral. Sempre responda chamando a função entregar_dieta.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "entregar_dieta",
              description: "Entrega o plano alimentar do dia",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Uma frase curta sobre o plano" },
                  meals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        time_label: { type: "string" },
                        name: { type: "string" },
                        items: { type: "array", items: { type: "string" } },
                        kcal: { type: "number" },
                      },
                      required: ["time_label", "name", "items", "kcal"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["summary", "meals"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "entregar_dieta" } },
      }),
    });

    if (res.status === 429) throw new Error("Muitos pedidos agora. Tente de novo em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!res.ok) throw new Error("Não consegui montar a dieta agora.");

    const json = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("A IA não retornou um plano válido.");

    const parsed = z
      .object({
        summary: z.string(),
        meals: z
          .array(
            z.object({
              time_label: z.string(),
              name: z.string(),
              items: z.array(z.string()),
              kcal: z.number(),
            }),
          )
          .min(1),
      })
      .parse(JSON.parse(args));

    return {
      meals: parsed.meals.map((m) => ({ ...m, kcal: Math.round(m.kcal) })),
      summary: parsed.summary,
      kcalTotal: Math.round(parsed.meals.reduce((s, m) => s + m.kcal, 0)),
    };
  });
