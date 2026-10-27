import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeNotifications } from '../services/db';
import { NotificationDoc } from '../types';

interface NotifState { items: NotificationDoc[]; unread: number }
const Ctx = createContext<NotifState>({ items: [], unread: 0 });
export const useNotifs = () => useContext(Ctx);

export function NotifProvider({ children }: { children: React.ReactNode }) {
  const { profile, isDemo } = useAuth();
  const [items, setItems] = useState<NotificationDoc[]>([]);

  useEffect(() => {
    if (isDemo || !profile || profile.role !== 'student') { setItems([]); return; }
    return subscribeNotifications(profile.uid, setItems);
  }, [isDemo, profile]);

  return <Ctx.Provider value={{ items, unread: items.filter((n) => !n.read).length }}>{children}</Ctx.Provider>;
}
