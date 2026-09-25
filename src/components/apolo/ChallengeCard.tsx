import { Link } from "@tanstack/react-router";

const MILESTONES = [10, 20, 30];

type Props = {
  completedCount: number;
  todayDay: number;
  doneToday: boolean;
  allDone: boolean;
  pendingCount: number;
};

export function ChallengeCard({
  completedCount,
  todayDay,
  doneToday,
  allDone,
  pendingCount,
}: Props) {
  const finished = completedCount >= 30;
  const nextMilestone = MILESTONES.find((m) => completedCount < m) ?? null;
  const toMilestone = nextMilestone ? nextMilestone - completedCount : 0;

  let note: string;
  if (finished) note = "Você completou os 30 dias. O Método Apolo agora é seu.";
  else if (doneToday && toMilestone === 1)
    note = `Amanhã você chega ao marco do dia ${nextMilestone}.`;
  else if (doneToday)
    note = `Dia ${todayDay} marcado. Faltam ${toMilestone} dias para o marco do dia ${nextMilestone}.`;
  else if (allDone) note = `Marcando o dia ${todayDay}…`;
  else if (pendingCount === 1) note = `Falta 1 missão para marcar o dia ${todayDay}.`;
  else note = `Conclua as missões de hoje para marcar o dia ${todayDay}.`;

  return (
    <Link
      to="/protocolo"
      className="surface-deep rise mt-6 block p-6"
      style={{ "--stagger": "280ms" } as React.CSSProperties}
      aria-label={`Desafio Apolo, dia ${todayDay} de 30. ${note}`}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-[1.5rem] text-primary-foreground">Desafio Apolo</h2>
        <span className="text-[15px] text-primary-foreground/85">
          Dia {Math.min(todayDay, 30)} de 30
        </span>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20">
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-700 ease-out"
          style={{ width: `${(completedCount / 30) * 100}%` }}
        />
      </div>
      <p className="mt-3 text-[15px] text-primary-foreground/85">{note}</p>
    </Link>
  );
}
