import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  /** data URL (image/jpeg ou image/png), já reduzida no cliente */
  dataUrl: z
    .string()
    .regex(/^data:image\/(jpeg|png|webp);base64,/)
    .max(2_500_000),
});

/**
 * Foto da refeição → descrição curta em texto ("Arroz, feijão, carne moída e
 * salada de tomate"). A foto não é guardada: vai para a IA e volta só o texto,
 * que a pessoa revisa antes de registrar.
 */
export const describeMealPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<{ description: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey)
      throw new Error("A leitura por foto está indisponível agora. Escreva o que comeu.");

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
              "Você descreve fotos de refeições em português do Brasil. Responda só com a lista dos alimentos visíveis, separados por vírgula, em minúsculas, sem quantidades, sem calorias e sem comentários. Exemplo: arroz, feijão, carne moída e salada de tomate. Se não for comida, responda exatamente: NAO_E_COMIDA.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "O que tem nesta refeição?" },
              { type: "image_url", image_url: { url: data.dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const failure = (await res.json().catch(() => null)) as { message?: string } | null;
      if (res.status === 429)
        throw new Error(failure?.message || "Muitos pedidos agora. Tente de novo em instantes.");
      if (res.status === 402) throw new Error(failure?.message || "Os créditos de IA acabaram.");
      throw new Error(failure?.message || "Não consegui ler a foto agora.");
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const description = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!description || description.includes("NAO_E_COMIDA"))
      throw new Error("Não reconheci comida nessa foto. Tente outra ou escreva o que comeu.");
    return { description: description.replace(/\.$/, "") };
  });
