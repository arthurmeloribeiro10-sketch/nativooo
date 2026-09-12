import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  weightKg: z.number().min(25).max(300),
  heightCm: z.number().min(100).max(250),
  goal: z.string().max(120).optional(),
  activityLevel: z.string().max(120).optional(),
  preferences: z.string().max(500).optional(),
  restrictions: z.string().max(500).optional(),
  includeFoods: z.string().max(500).optional(),
  avoidFoods: z.string().max(500).optional(),
  mealCount: z.number().int().min(1).max(10),
  prepTime: z.string().max(120).optional(),
  startTime: z.string().max(10).optional(),
  notes: z.string().max(500).optional(),
});

export type DietMeal = {
  time_label: string;
  name: string;
  items: string[];
  kcal: number;
};

export type DietPlan = {
  meals: DietMeal[];
  summary: string;
  kcalTotal: number;
};

export const generateDietPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<DietPlan> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("IA indisponível no momento.");

    const prompt = `Crie um plano alimentar inspirado na abordagem pró-metabólica associada a Ray Peat, explicada como preferência por alimentos de fácil digestão, proteína suficiente e fontes de energia regulares. Não trate essa abordagem como consenso médico. Use ingredientes brasileiros acessíveis para uma pessoa de ${data.weightKg} kg e ${data.heightCm} cm.${
      data.goal ? ` Objetivo: ${data.goal}.` : ""
    } Atividade física: ${data.activityLevel || "não informada"}. Preferências: ${data.preferences || "não informadas"}. Restrições: ${data.restrictions || "não informadas"}. Incluir: ${data.includeFoods || "sem pedido específico"}. Evitar: ${data.avoidFoods || "sem pedido específico"}. Tempo para preparo: ${data.prepTime || "não informado"}. Use exatamente ${data.mealCount} refeições, com horários em formato "07h30".${
      data.startTime ? ` A primeira refeição deve começar às ${data.startTime} e as demais devem seguir a partir desse horário.` : ""
    }${
      data.notes ? ` Observações e pedidos da pessoa (respeite-os): ${data.notes}.` : ""
    } Ingredientes brasileiros e acessíveis. Responda em português do Brasil.`;

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
              "Você é um nutricionista especializado na abordagem pró-metabólica de Ray Peat. Sempre responda chamando a função entregar_dieta.",
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

    if (!res.ok) {
      const failure = (await res.json().catch(() => null)) as { message?: string } | null;
      if (res.status === 429) throw new Error(failure?.message || "Muitos pedidos agora. Aguarde um instante e tente novamente.");
      if (res.status === 402) throw new Error(failure?.message || "Os créditos de IA acabaram. O responsável pelo app precisa adicionar créditos.");
      if (res.status === 403) throw new Error(failure?.message || "A IA está bloqueada para este espaço. Peça ao responsável para revisar a configuração.");
      if (res.status === 401) throw new Error("A IA não está configurada corretamente.");
      throw new Error(failure?.message || "Não consegui montar a dieta agora.");
    }

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
              items: z.array(z.string().max(160)).min(1).max(12),
              kcal: z.number().min(0).max(3000),
            }),
          )
          .min(1).max(10),
      })
      .parse(JSON.parse(args));

    return {
      meals: parsed.meals.map((m) => ({ ...m, kcal: Math.round(m.kcal) })),
      summary: parsed.summary,
      kcalTotal: Math.round(parsed.meals.reduce((s, m) => s + m.kcal, 0)),
    };
  });
