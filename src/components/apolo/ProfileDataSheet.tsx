import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { ProfileRow } from "@/lib/nativo-queries";

type Values = {
  display_name: string;
  step_goal: number;
  meal_goal: number;
  birth_date: string | null;
  metabolic_sex: "female" | "male" | null;
  timezone: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileRow | undefined;
  email: string;
  saving: boolean;
  onSave: (values: Values) => void;
  onSignOut: () => void;
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-sand-deep bg-card px-4 py-3 text-[16px] text-foreground outline-none focus:border-primary";

export function ProfileDataSheet({
  open,
  onOpenChange,
  profile,
  email,
  saving,
  onSave,
  onSignOut,
}: Props) {
  const [nome, setNome] = useState("");
  const [passos, setPassos] = useState("8000");
  const [refeicoes, setRefeicoes] = useState("4");
  const [nascimento, setNascimento] = useState("");
  const [sexo, setSexo] = useState<"" | "female" | "male">("");

  useEffect(() => {
    if (!profile || !open) return;
    setNome(profile.display_name);
    setPassos(String(profile.step_goal));
    setRefeicoes(String(profile.meal_goal));
    setNascimento(profile.birth_date ?? "");
    setSexo(profile.metabolic_sex ?? "");
  }, [profile, open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg rounded-t-[28px] border-0 bg-background">
        <div className="max-h-[85dvh] overflow-y-auto px-5 pb-8">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle className="font-display text-2xl font-semibold text-foreground">
              Seus dados e metas
            </DrawerTitle>
            <DrawerDescription>{email}</DrawerDescription>
          </DrawerHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSave({
                display_name: nome.trim() || "Apolo",
                step_goal: Number(passos) || 8000,
                meal_goal: Number(refeicoes) || 4,
                birth_date: nascimento || null,
                metabolic_sex: sexo || null,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              });
            }}
          >
            <label className="block text-sm font-medium text-foreground">
              Como quer ser chamado
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="given-name"
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-foreground">
                Meta de passos
                <input
                  type="number"
                  inputMode="numeric"
                  min={1000}
                  step={500}
                  value={passos}
                  onChange={(e) => setPassos(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-foreground">
                Refeições por dia
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={10}
                  value={refeicoes}
                  onChange={(e) => setRefeicoes(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-foreground">
                Nascimento
                <input
                  type="date"
                  value={nascimento}
                  onChange={(e) => setNascimento(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-foreground">
                Sexo (para cálculos)
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value as "" | "female" | "male")}
                  className={inputClass}
                >
                  <option value="">Prefiro não dizer</option>
                  <option value="female">Feminino</option>
                  <option value="male">Masculino</option>
                </select>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Esses dados são privados e servem só para ajustar suas metas.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="press min-h-12 w-full rounded-full bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </form>

          <button
            type="button"
            onClick={onSignOut}
            className="press mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-sand-deep text-[15px] font-medium text-muted-foreground"
          >
            <LogOut className="size-4" strokeWidth={1.8} />
            Sair da conta
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
