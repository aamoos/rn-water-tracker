// src/store/profile.tsx
import 'react-native-get-random-values'; // uuid 폴리필 (uuid import보다 먼저)
import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Profile, IntakeLog, Reminder } from "../types";
import { calcDailyWaterTargetMl } from "../lib/calc";
import { ymd } from "../lib/date";
import {
  ensureNotificationPermission,
  scheduleDailyReminder,
  cancelReminder,
} from "../lib/notifications";

// AsyncStorage keys
const KEY_PROFILE = "wt.profile";
const KEY_LOGS = "wt.logs";
const KEY_REMIND = "wt.reminders";

type ProfileCtx = {
  // 프로필 & 권장량
  profile: Profile | null;
  setHW: (heightCm: number, weightKg: number) => void;

  // 섭취 로그
  logs: IntakeLog[];
  addLog: (beverage: string, amount: number) => void;
  removeLog: (id: string) => void;                  // ✅ 추가
  todayTotal: number;

  // 알림
  reminders: Reminder[];
  addDailyReminder: (hour: number, minute: number) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;

  // 달력용
  dayTotals: Record<string, number>;              // YYYY-MM-DD -> 합계(ml)
  getLogsByDate: (dayKey: string) => IntakeLog[]; // 특정 날짜의 로그
};

const Ctx = createContext<ProfileCtx | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<IntakeLog[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // --- 초기 복원 ---
  useEffect(() => {
    (async () => {
      try {
        const [p, l, r] = await Promise.all([
          AsyncStorage.getItem(KEY_PROFILE),
          AsyncStorage.getItem(KEY_LOGS),
          AsyncStorage.getItem(KEY_REMIND),
        ]);
        if (p) setProfile(JSON.parse(p));
        if (l) setLogs(JSON.parse(l));
        if (r) setReminders(JSON.parse(r));
      } catch (e) {
        console.warn("restore failed", e);
      }
    })();
  }, []);

  // --- 변경 시 저장 ---
  useEffect(() => {
    if (profile) AsyncStorage.setItem(KEY_PROFILE, JSON.stringify(profile)).catch(() => { });
  }, [profile]);

  useEffect(() => {
    AsyncStorage.setItem(KEY_LOGS, JSON.stringify(logs)).catch(() => { });
  }, [logs]);

  useEffect(() => {
    AsyncStorage.setItem(KEY_REMIND, JSON.stringify(reminders)).catch(() => { });
  }, [reminders]);

  const api = useMemo<ProfileCtx>(() => {
    // 오늘 합계
    const todayKey = ymd(new Date());
    const todayTotal = logs
      .filter((l) => ymd(l.createdAt) === todayKey)
      .reduce((s, l) => s + l.amount, 0);

    // 날짜별 합계
    const totals: Record<string, number> = {};
    for (const l of logs) {
      const k = ymd(l.createdAt);
      totals[k] = (totals[k] ?? 0) + l.amount;
    }

    return {
      // 프로필
      profile,
      setHW: (heightCm, weightKg) => {
        const dailyTargetMl = calcDailyWaterTargetMl(weightKg);
        setProfile({ heightCm, weightKg, dailyTargetMl });
      },

      // 섭취 로그
      logs,
      addLog: (beverage, amount) => {
        setLogs((prev) => [
          ...prev,
          { id: uuidv4(), beverage, amount, createdAt: Date.now() },
        ]);
      },
      removeLog: (id) => {                           // ✅ 추가 구현
        setLogs((prev) => prev.filter((l) => l.id !== id));
      },
      todayTotal,

      // 알림
      reminders,
      addDailyReminder: async (hour, minute) => {
        const ok = await ensureNotificationPermission();
        if (!ok) throw new Error("알림 권한이 없습니다.");
        const notifId = await scheduleDailyReminder(
          hour,
          minute,
          `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} 물 한 잔!`
        );
        const id = uuidv4();
        setReminders((prev) => [...prev, { id, hour, minute, notifId }]);
      },
      removeReminder: async (id) => {
        const r = reminders.find((x) => x.id === id);
        if (r) await cancelReminder(r.notifId);
        setReminders((prev) => prev.filter((x) => x.id !== id));
      },

      // 달력용
      dayTotals: totals,
      getLogsByDate: (dayKey: string) => logs.filter((l) => ymd(l.createdAt) === dayKey),
    };
  }, [profile, logs, reminders]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProfile() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
