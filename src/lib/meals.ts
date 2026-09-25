/**
 * Leitura leve do que entrou no dia — sem contar caloria.
 * Classifica um registro em "comida de verdade", "dá pra melhorar" ou
 * "ultraprocessado" a partir de palavras-chave em português, e infere o
 * momento da refeição pela hora. Tudo determinístico e local.
 */

export type MealTag = "real" | "mixed" | "processed" | "unknown";

export const MEAL_TAG_LABEL: Record<MealTag, string> = {
  real: "Comida de verdade",
  mixed: "Dá pra melhorar",
  processed: "Ultraprocessado",
  unknown: "Registrado",
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const REAL = [
  "ovo",
  "ovos",
  "omelete",
  "mexido",
  "arroz",
  "feijao",
  "lentilha",
  "grao de bico",
  "quinoa",
  "carne",
  "bife",
  "file",
  "frango",
  "peixe",
  "salmao",
  "atum",
  "sardinha",
  "costela",
  "picanha",
  "carne moida",
  "figado",
  "salada",
  "alface",
  "tomate",
  "cenoura",
  "brocolis",
  "abobora",
  "abobrinha",
  "batata",
  "batata doce",
  "mandioca",
  "aipim",
  "macaxeira",
  "inhame",
  "cara",
  "legumes",
  "verduras",
  "couve",
  "espinafre",
  "repolho",
  "pepino",
  "beterraba",
  "cebola",
  "alho",
  "pimentao",
  "vagem",
  "chuchu",
  "quiabo",
  "jilo",
  "milho",
  "tapioca",
  "cuscuz",
  "iogurte natural",
  "queijo",
  "leite",
  "cafe",
  "aveia",
  "castanha",
  "amendoim",
  "nozes",
  "azeite",
  "mel",
  "coco",
  "agua de coco",
  "sopa",
  "caldo",
  "canja",
  "pao integral",
  "suco natural",
  "cha",
  "requeijao",
  "manteiga",
  "ricota",
  "cottage",
  "kefir",
];

export const FRUITS = [
  "banana",
  "maca",
  "mamao",
  "laranja",
  "manga",
  "uva",
  "abacaxi",
  "melancia",
  "melao",
  "morango",
  "abacate",
  "pera",
  "kiwi",
  "goiaba",
  "caju",
  "acerola",
  "tangerina",
  "mexerica",
  "fruta",
  "frutas",
  "ameixa",
  "pessego",
  "figo",
  "jabuticaba",
  "maracuja",
  "limao",
  "cereja",
  "framboesa",
  "mirtilo",
  "blueberry",
  "amora",
  "pitaya",
  "carambola",
  "graviola",
  "acai",
];

const PROCESSED = [
  "refrigerante",
  "coca",
  "guarana",
  "fanta",
  "sprite",
  "pepsi",
  "salgadinho",
  "chips",
  "doritos",
  "cheetos",
  "biscoito recheado",
  "bolacha recheada",
  "nuggets",
  "miojo",
  "lamen",
  "macarrao instantaneo",
  "lasanha congelada",
  "pizza",
  "hamburguer",
  "hamburger",
  "burger",
  "fast food",
  "mcdonald",
  "burger king",
  "cachorro quente",
  "salsicha",
  "presunto",
  "mortadela",
  "peito de peru",
  "sorvete",
  "chocolate",
  "bala",
  "chiclete",
  "energetico",
  "suco de caixinha",
  "suco em po",
  "nescau",
  "toddy",
  "achocolatado",
  "sucrilhos",
  "cereal matinal",
  "pao de forma",
  "bolo pronto",
  "brigadeiro",
  "margarina",
  "molho pronto",
  "ketchup",
  "maionese",
  "batata frita",
  "frito",
  "fritura",
  "empanado",
  "coxinha",
  "pastel",
  "esfiha",
  "croissant",
  "donut",
  "rosquinha",
  "waffle",
  "barra de cereal",
  "tempero pronto",
  "sazon",
  "knorr",
  "pipoca de microondas",
  "ifood",
  "delivery",
  "bombom",
  "doce",
  "acucar",
  "refri",
  "salgado",
  "bolacha",
  "biscoito",
  "granola",
  "torta",
  "lanche pronto",
  "nutella",
];

const MIXED = [
  "pao",
  "pao frances",
  "macarrao",
  "massa",
  "bolo",
  "pao de queijo",
  "farofa",
  "panqueca",
  "pizza caseira",
];

function hits(text: string, list: string[]) {
  return list.filter((term) => new RegExp(`(^|\\s)${term}(s|es)?(\\s|$)`).test(text));
}

export type MealReading = {
  tag: MealTag;
  hasFruit: boolean;
  realHits: string[];
  processedHits: string[];
};

export function classifyMeal(text: string): MealReading {
  const normalized = normalize(text);
  const fruitHits = hits(normalized, FRUITS);
  const realHits = [...hits(normalized, REAL), ...fruitHits];
  const processedHits = hits(normalized, PROCESSED);
  const mixedHits = hits(normalized, MIXED);

  let tag: MealTag;
  if (processedHits.length && !realHits.length) tag = "processed";
  else if (processedHits.length)
    tag = processedHits.length > realHits.length ? "processed" : "mixed";
  else if (realHits.length) tag = mixedHits.length > realHits.length ? "mixed" : "real";
  else if (mixedHits.length) tag = "mixed";
  else tag = "unknown";

  return { tag, hasFruit: fruitHits.length > 0, realHits, processedHits };
}

/* ---------- momentos do dia ---------- */

export type MealSlot = { name: string; from: number; to: number; suggestedTime: string };

export const MEAL_SLOTS: MealSlot[] = [
  { name: "Café da manhã", from: 4, to: 10.5, suggestedTime: "08:00" },
  { name: "Lanche da manhã", from: 10.5, to: 11.75, suggestedTime: "10:30" },
  { name: "Almoço", from: 11.75, to: 14.75, suggestedTime: "12:30" },
  { name: "Lanche", from: 14.75, to: 18.25, suggestedTime: "16:00" },
  { name: "Jantar", from: 18.25, to: 21.75, suggestedTime: "19:30" },
  { name: "Ceia", from: 21.75, to: 28, suggestedTime: "22:00" },
];

const SLOT_NAMES = new Set(MEAL_SLOTS.map((s) => s.name));

export function slotForHour(hourDecimal: number): MealSlot {
  const h = hourDecimal < 4 ? hourDecimal + 24 : hourDecimal;
  return MEAL_SLOTS.find((s) => h >= s.from && h < s.to) ?? MEAL_SLOTS[0]!;
}

export function timeLabelNow(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function isSlotName(name: string) {
  return SLOT_NAMES.has(name);
}

type MealLike = {
  name: string;
  items: string[];
  note: string | null;
  time_label: string;
  done: boolean;
};

/** Texto do registro (o que a pessoa comeu). */
export function mealDescription(meal: MealLike): string {
  if (meal.items.length) return meal.items.join(", ");
  if (!isSlotName(meal.name)) return meal.name;
  return meal.note && !/^registrad/i.test(meal.note) ? meal.note : "";
}

/** Nome do momento (Café da manhã, Almoço…) — inferido pela hora quando o registro não tem. */
export function mealMoment(meal: MealLike): string {
  if (isSlotName(meal.name)) return meal.name;
  const match = /^(\d{1,2}):(\d{2})/.exec(meal.time_label);
  if (match) return slotForHour(Number(match[1]) + Number(match[2]) / 60).name;
  return meal.name;
}

export function readMeal(meal: MealLike): MealReading {
  return classifyMeal(`${mealDescription(meal)} ${isSlotName(meal.name) ? "" : meal.name}`);
}

/** Próximo momento ainda sem registro, a partir da hora atual. */
export function nextMealSlot(meals: MealLike[], now = new Date()): MealSlot | null {
  const registered = new Set(meals.filter((m) => m.done).map(mealMoment));
  const hour = now.getHours() + now.getMinutes() / 60;
  const current = slotForHour(hour);
  const startIndex = MEAL_SLOTS.findIndex((s) => s.name === current.name);
  for (let i = startIndex; i < MEAL_SLOTS.length; i++) {
    const slot = MEAL_SLOTS[i]!;
    if (!registered.has(slot.name)) return slot;
  }
  return null;
}

/* ---------- resumo do dia ---------- */

export type NaturalDaySummary = {
  real: number;
  total: number;
  hasFruit: boolean;
  headline: string;
  detail: string;
};

export function naturalDaySummary(meals: MealLike[]): NaturalDaySummary {
  const done = meals.filter((m) => m.done);
  const readings = done.map(readMeal);
  const real = readings.filter((r) => r.tag === "real").length;
  const hasFruit = readings.some((r) => r.hasFruit);
  const total = done.length;

  if (total === 0) {
    return {
      real,
      total,
      hasFruit,
      headline: "Seu dia ainda está em branco",
      detail: "Registre a primeira refeição. Leva segundos.",
    };
  }

  const mealWord = total === 1 ? "refeição" : "refeições";
  const fruitNote = hasFruit ? "Fruta já entrou." : "Falta uma fruta.";
  const headline =
    real === total
      ? "Dia natural até aqui"
      : real >= total / 2
        ? "Dia no caminho"
        : "Dá pra escolher melhor";
  const detail = `${real} de ${total} ${mealWord} com comida de verdade. ${fruitNote}`;
  return { real, total, hasFruit, headline, detail };
}
