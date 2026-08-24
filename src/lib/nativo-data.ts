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
