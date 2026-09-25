import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import {
  REMINDER_COPY,
  notificationsSupported,
  requestNotificationPermission,
  useReminderPrefs,
  type ReminderKind,
} from "@/lib/reminders";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
};

export function RemindersSheet({ open, onOpenChange, userId }: Props) {
  const { prefs, update } = useReminderPrefs(userId);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setPermission(notificationsSupported() ? Notification.permission : "unsupported");
  }, [open]);

  async function toggle(kind: ReminderKind, enabled: boolean) {
    if (enabled) {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === "unsupported") {
        toast.error(
          "Este navegador não mostra notificações. Instale o Apolo na tela inicial para receber.",
        );
        return;
      }
      if (result !== "granted") {
        toast.error("Sem permissão de notificação, o lembrete não consegue tocar.");
        return;
      }
    }
    update(kind, { enabled });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg rounded-t-[28px] border-0 bg-background">
        <div className="px-5 pb-8">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle className="font-display text-2xl font-semibold text-foreground">
              Lembretes
            </DrawerTitle>
            <DrawerDescription>
              Tocam enquanto o Apolo estiver aberto ou instalado na tela inicial.
            </DrawerDescription>
          </DrawerHeader>

          <ul className="surface divide-y divide-border px-5">
            {(Object.keys(REMINDER_COPY) as ReminderKind[]).map((kind) => (
              <li key={kind} className="flex items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-medium text-foreground">
                    {REMINDER_COPY[kind].label}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {REMINDER_COPY[kind].hint}
                  </p>
                </div>
                <input
                  type="time"
                  value={prefs[kind].time}
                  onChange={(e) => update(kind, { time: e.target.value })}
                  aria-label={`Horário de ${REMINDER_COPY[kind].label.toLowerCase()}`}
                  className="rounded-xl border border-sand-deep bg-card px-2 py-1.5 text-[15px] text-foreground"
                />
                <Switch
                  checked={prefs[kind].enabled}
                  onCheckedChange={(checked) => void toggle(kind, checked)}
                  aria-label={REMINDER_COPY[kind].label}
                  className="h-7 w-12 data-[state=checked]:bg-primary [&>span]:size-6 [&>span]:data-[state=checked]:translate-x-5"
                />
              </li>
            ))}
          </ul>

          {permission === "denied" ? (
            <p className="mt-4 text-sm text-terracotta">
              As notificações estão bloqueadas nas configurações do navegador para este site.
            </p>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
