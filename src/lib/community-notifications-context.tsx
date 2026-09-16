import { createContext, useContext, type ReactNode } from "react";

import { useCommunityNotifications } from "@/lib/nativo-queries";

type NotificationState = ReturnType<typeof useCommunityNotifications>;

const CommunityNotificationsContext = createContext<NotificationState | null>(null);

export function CommunityNotificationsProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const state = useCommunityNotifications(userId);
  return (
    <CommunityNotificationsContext.Provider value={state}>
      {children}
    </CommunityNotificationsContext.Provider>
  );
}

export function useCommunityNotificationsContext() {
  const value = useContext(CommunityNotificationsContext);
  if (!value) throw new Error("Community notifications must be used inside AppShell.");
  return value;
}