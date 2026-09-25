import { Trash2 } from "lucide-react";

import {
  MEAL_TAG_LABEL,
  mealDescription,
  mealMoment,
  readMeal,
  type MealSlot,
  type MealTag,
} from "@/lib/meals";
import type { MealRow } from "@/lib/nativo-queries";

const TAG_CLASS: Record<MealTag, string> = {
  real: "bg-secondary text-primary",
  mixed: "bg-sand text-gold-deep",
  processed: "bg-terracotta/15 text-terracotta",
  unknown: "bg-muted text-muted-foreground",
};

type Props = {
  title: string;
  meals: MealRow[];
  loading: boolean;
  nextSlot: MealSlot | null;
  onAddSlot: (slot: MealSlot) => void;
  onRemove: (meal: MealRow) => void;
};

export function MealTimeline({ title, meals, loading, nextSlot, onAddSlot, onRemove }: Props) {
  const done = meals.filter((m) => m.done);
  return (
    <section className="rise mt-7" style={{ "--stagger": "210ms" } as React.CSSProperties}>
      <h2 className="px-1 text-[1.5rem]">{title}</h2>
      <div className="surface mt-3 px-6">
        {loading ? (
          <p className="py-5 text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <ul className="divide-y divide-border">
            {done.map((meal) => {
              const reading = readMeal(meal);
              const description = mealDescription(meal);
              return (
                <li key={meal.id} className="group flex gap-4 py-4">
                  <span className="w-12 shrink-0 pt-0.5 text-[15px] text-muted-foreground">
                    {/^\d{1,2}:\d{2}$/.test(meal.time_label) ? meal.time_label : "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-muted-foreground">
                      {mealMoment(meal)}
                    </p>
                    {description ? (
                      <p className="mt-0.5 text-[16px] leading-snug text-foreground">
                        {description}
                      </p>
                    ) : null}
                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-[13px] font-semibold ${TAG_CLASS[reading.tag]}`}
                    >
                      {MEAL_TAG_LABEL[reading.tag]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(meal)}
                    aria-label={`Remover ${mealMoment(meal)}`}
                    className="press self-start rounded-full p-2 text-muted-foreground/60 hover:text-terracotta"
                  >
                    <Trash2 className="size-4" strokeWidth={1.8} />
                  </button>
                </li>
              );
            })}
            {nextSlot ? (
              <li className="flex items-center gap-4 py-4">
                <span className="w-12 shrink-0 text-[15px] text-muted-foreground">
                  {nextSlot.suggestedTime}
                </span>
                <span className="flex-1 text-[16px] text-muted-foreground">{nextSlot.name}</span>
                <button
                  type="button"
                  onClick={() => onAddSlot(nextSlot)}
                  className="press rounded-full border border-dashed border-primary/50 px-5 py-2 text-[15px] font-semibold text-primary"
                >
                  Adicionar
                </button>
              </li>
            ) : done.length === 0 ? (
              <li className="py-5 text-sm text-muted-foreground">
                Nenhuma refeição registrada neste dia.
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </section>
  );
}
