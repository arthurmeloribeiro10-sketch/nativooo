export type MetabolicSex = "female" | "male";

const activityFactors: Record<string, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  alto: 1.725,
  muito_alto: 1.9,
};

export function ageFromBirthDate(birthDate: string, now = new Date()): number {
  const birth = new Date(`${birthDate}T12:00:00`);
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function calculateEnergyTarget(input: {
  weightKg: number;
  heightCm: number;
  birthDate: string;
  metabolicSex: MetabolicSex;
  activityLevel: string;
  goal?: string;
}) {
  const age = ageFromBirthDate(input.birthDate);
  const sexAdjustment = input.metabolicSex === "male" ? 5 : -161;
  const bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * age + sexAdjustment;
  const factor = activityFactors[input.activityLevel] ?? 1.2;
  const normalizedGoal = (input.goal ?? "").toLocaleLowerCase("pt-BR");
  const goalAdjustment =
    normalizedGoal.includes("perder") || normalizedGoal.includes("emagrecer")
      ? -300
      : normalizedGoal.includes("ganhar") || normalizedGoal.includes("massa")
        ? 250
        : 0;
  const targetKcal = Math.max(1200, Math.round((bmr * factor + goalAdjustment) / 50) * 50);
  return {
    age,
    bmr: Math.round(bmr),
    activityFactor: factor,
    goalAdjustment,
    targetKcal,
    formula: "Mifflin–St Jeor",
  };
}
