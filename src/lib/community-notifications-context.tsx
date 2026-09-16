import { createContext, useContext, type ReactNode } from "react";

import { useAuth } from "@/lib/auth-context";
import { useCommunityNotifications } from "@/lib/nativo-queries";

type NotificationState = ReturnType<typeof useCommunityNotifications>;

const CommunityNotificationsContext = createContext<NotificationState | null>(null);

export function CommunityNotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const state = useCommunityNotifications(user?.id);
  return (
    <CommunityNotificationsContext.Provider value={state}>
      {children}
    </CommunityNotificationsContext.Provider>
  );
}

export function useCommunityNotificationsContext() {
  const value = useContext(CommunityNotificationsContext);
  if (!value) throw new Error("Community notifications provider is missing.");
  return value;
}