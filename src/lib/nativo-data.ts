export type PillarKey = "alimentacao" | "movimento" | "sono" | "sol" | "presenca" | "habitos";

export type Pillar = {
  key: PillarKey;
  label: string;
  score: number;
  note: string;
};

export const pillars: Pillar[] = [
  {
    key: "alimentacao",
    label: "Alimentação",
    score: 84,
    note: "Comida real na maior parte do dia. Bom equilíbrio.",
  },
  {
    key: "movimento",
    label: "Movimento",
    score: 76,
    note: "Você se moveu em 5 dos últimos 7 dias.",
  },
  {
    key: "sono",
    label: "Sono e recuperação",
    score: 58,
    note: "Seu sono pode ser o próximo hábito a receber atenção.",
  },
  {
    key: "sol",
    label: "Sol e natureza",
    score: 71,
    note: "Manhãs ao ar livre estão virando rotina.",
  },
  {
    key: "presenca",
    label: "Presença e telas",
    score: 64,
    note: "Alguns blocos sem celular já apareceram na semana.",
  },
  {
    key: "habitos",
    label: "Hábitos e protocolos",
    score: 88,
    note: "Sua consistência é o seu ponto mais forte.",
  },
];

export const nativoScore = Math.round(pillars.reduce((sum, p) => sum + p.score, 0) / pillars.length);

export const weeklyProgress = [
  { day: "Seg", score: 62 },
  { day: "Ter", score: 68 },
  { day: "Qua", score: 65 },
  { day: "Qui", score: 72 },
  { day: "Sex", score: 74 },
  { day: "Sáb", score: 70 },
  { day: "Dom", score: 78 },
];

export type Mission = {
  id: string;
  title: string;
  detail: string;
  pillar: string;
  done: boolean;
};

export const todayMissions: Mission[] = [
  {
    id: "m1",
    title: "15 minutos de sol antes das 10h",
    detail: "Sem óculos escuros, de preferência caminhando.",
    pillar: "Sol e natureza",
    done: true,
  },
  {
    id: "m2",
    title: "Uma refeição só com comida de verdade",
    detail: "Proteína, vegetal e um carboidrato natural.",
    pillar: "Alimentação",
    done: false,
  },
  {
    id: "m3",
    title: "30 minutos sem celular após o jantar",
    detail: "Deixe o aparelho em outro cômodo.",
    pillar: "Presença",
    done: false,
  },
  {
    id: "m4",
    title: "Caminhada de 20 minutos",
    detail: "Uma caminhada curta já conta.",
    pillar: "Movimento",
    done: false,
  },
];

export type ProtocolDay = {
  day: number;
  title: string;
  focus: string;
  state: "done" | "today" | "locked";
};

export const protocolDays: ProtocolDay[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const focos = [
    "Comida real",
    "Sol da manhã",
    "Movimento diário",
    "Sono regular",
    "Presença",
    "Natureza",
  ];
  return {
    day,
    title: `Dia ${day}`,
    focus: focos[i % focos.length],
    state: day < 12 ? "done" : day === 12 ? "today" : "locked",
  } as ProtocolDay;
});

export const communityPosts = [
  {
    id: "p1",
    name: "Marina R.",
    streak: 21,
    time: "há 12 min",
    text: "Dia 12 do protocolo. Acordei antes do despertador pela primeira vez em meses.",
    reactions: 34,
  },
  {
    id: "p2",
    name: "Caio F.",
    streak: 9,
    time: "há 1 h",
    text: "Troquei o café da manhã industrializado por ovos e fruta. Meu dia rende muito mais.",
    reactions: 21,
  },
  {
    id: "p3",
    name: "Juliana P.",
    streak: 30,
    time: "há 3 h",
    text: "Fechei os 30 dias. Não fiz nenhum dia perfeito, mas não parei nenhuma semana.",
    reactions: 58,
  },
];

export const ranking = [
  { pos: 1, name: "Juliana P.", streak: 30, missions: 112 },
  { pos: 2, name: "Marina R.", streak: 21, missions: 98 },
  { pos: 3, name: "Rafael T.", streak: 18, missions: 91 },
  { pos: 4, name: "Arthur", streak: 12, missions: 74, isUser: true },
  { pos: 5, name: "Caio F.", streak: 9, missions: 63 },
];

export const encouragements = [
  "Hoje você cuidou mais da sua vida do que ontem.",
  "Você não precisa de um dia perfeito para continuar.",
  "Comida real, movimento e presença: você está no caminho.",
  "Sua evolução acontece na consistência.",
  "Menos controle. Mais consciência.",
];

/* ---------- Dieta ---------- */

export type MealSlot = {
  id: string;
  time: string;
  name: string;
  items: string[];
  kcal: number;
  done: boolean;
};

export const dietPlan: MealSlot[] = [
  {
    id: "d1",
    time: "07h30",
    name: "Café da manhã",
    items: ["3 ovos caipiras", "Meio abacate", "Café coado sem açúcar"],
    kcal: 480,
    done: true,
  },
  {
    id: "d2",
    time: "12h30",
    name: "Almoço",
    items: ["Carne de pasto", "Arroz e feijão", "Salada com azeite"],
    kcal: 720,
    done: true,
  },
  {
    id: "d3",
    time: "16h00",
    name: "Lanche",
    items: ["Fruta da estação", "Castanhas"],
    kcal: 260,
    done: false,
  },
  {
    id: "d4",
    time: "20h00",
    name: "Jantar",
    items: ["Peixe assado", "Legumes na manteiga", "Batata-doce"],
    kcal: 610,
    done: false,
  },
];

export const dietTemplates = [
  {
    id: "t1",
    name: "Comida real clássica",
    detail: "Base do João Braga: proteína, vegetais e carboidrato natural em 4 refeições.",
    meals: 4,
  },
  {
    id: "t2",
    name: "Janela de 8 horas",
    detail: "Jejum leve das 20h às 12h, com 3 refeições densas dentro da janela.",
    meals: 3,
  },
  {
    id: "t3",
    name: "Treino pela manhã",
    detail: "Mais carboidrato natural no pós-treino e jantar mais leve.",
    meals: 5,
  },
];

/* ---------- Sol ---------- */

export type SunHour = { hour: string; uv: number };

export const sunToday = {
  condition: "Céu limpo com nuvens altas",
  uvPeak: 9,
  sunrise: "06h12",
  sunset: "17h48",
  bestWindow: "07h00 – 09h30",
  avoidWindow: "11h00 – 15h00",
  minutesRecommended: 20,
  verdict: "bom" as "bom" | "moderado" | "evitar",
  message:
    "Dia bom para pegar sol. Aproveite a manhã: 20 minutos de pele exposta antes das 9h30, sem óculos escuros.",
};

export const sunHours: SunHour[] = [
  { hour: "6h", uv: 0 },
  { hour: "8h", uv: 3 },
  { hour: "10h", uv: 6 },
  { hour: "12h", uv: 9 },
  { hour: "14h", uv: 7 },
  { hour: "16h", uv: 3 },
  { hour: "18h", uv: 0 },
];

/* ---------- Passos ---------- */

export const stepsToday = { steps: 7420, goal: 10000, km: 5.4, minutesActive: 62 };

export const stepsWeek = [
  { day: "Seg", steps: 6100 },
  { day: "Ter", steps: 9400 },
  { day: "Qua", steps: 5200 },
  { day: "Qui", steps: 11200 },
  { day: "Sex", steps: 8300 },
  { day: "Sáb", steps: 12800 },
  { day: "Dom", steps: 7420 },
];

/* ---------- Sono ---------- */

export type SleepNight = { day: string; hours: number; quality: number };

export const sleepWeek: SleepNight[] = [
  { day: "Seg", hours: 6.2, quality: 62 },
  { day: "Ter", hours: 7.1, quality: 74 },
  { day: "Qua", hours: 5.8, quality: 51 },
  { day: "Qui", hours: 7.6, quality: 81 },
  { day: "Sex", hours: 6.9, quality: 70 },
  { day: "Sáb", hours: 8.1, quality: 88 },
  { day: "Dom", hours: 7.3, quality: 76 },
];

export const sleepAverage =
  Math.round((sleepWeek.reduce((s, n) => s + n.hours, 0) / sleepWeek.length) * 10) / 10;
