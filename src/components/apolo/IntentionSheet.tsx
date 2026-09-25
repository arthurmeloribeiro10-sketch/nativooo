import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { INTENTIONS, type Intention } from "@/lib/rituals";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  current: Intention | undefined;
  onChoose: (intention: Intention) => void;
};

/** Uma palavra para o dia — vira o título da Home. */
export function IntentionSheet({ open, onOpenChange, name, current, onChoose }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg rounded-t-[28px] border-0 bg-background">
        <div className="pb-8">
          <DrawerHeader className="text-center">
            <DrawerTitle className="font-display text-2xl font-semibold text-foreground">
              Como você quer viver hoje, {name}?
            </DrawerTitle>
            <DrawerDescription>
              Escolha uma palavra. Ela fica com você o dia inteiro.
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid grid-cols-2 gap-2.5 px-5">
            {INTENTIONS.map((item, i) => {
              const active = item.word === current;
              return (
                <button
                  key={item.word}
                  type="button"
                  onClick={() => onChoose(item.word)}
                  className={`lift rise flex min-h-20 flex-col items-start justify-center rounded-3xl px-4 py-3 text-left ${
                    active ? "bg-primary text-primary-foreground" : "surface"
                  }`}
                  style={{ "--stagger": `${i * 50}ms` } as React.CSSProperties}
                >
                  <span className="font-display text-lg font-semibold">{item.word}</span>
                  <span
                    className={`mt-0.5 text-xs ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    {item.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
