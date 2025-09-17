// src/store/profile.ts
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { calcDailyWaterTargetMl } from "../lib/calc";
import { ymd } from "../lib/date";
import {
  ensureNotificationPermission,
  scheduleDailyReminder,
  cancelReminder,
} from "../lib/notifications";

// ---------- Types ----------
export type Profile = {
  heightCm: number;
  weightKg: number;
  dailyTargetMl: number;
};

export type IntakeLog = {
  id: string;
  beverage: string; // "물"
  amount: number; // ml
  createdAt: number; // timestamp
};

export type Reminder = {
  id: string; // expo-notifications schedule id
  hour: number;
  minute: number;
};

export type CustomWaterPreset = {
  id: string;
  label: string;
  amount: number;
  icon: string;       // ← 필수로 변경
  isCustom?: boolean; // UI 용도
};

// ---------- Storage Keys ----------
const KEY_PROFILE = "wt.profile";
const KEY_LOGS = "wt.logs";
const KEY_REMINDERS = "wt.reminders";
const KEY_PRESETS = "wt.custom_presets";

// ---------- Context Shape ----------
type ProfileCtx = {
  // 프로필
  profile: Profile | null;
  setHW: (heightCm: number, weightKg: number) => void;

  // 로그
  logs: IntakeLog[];
  addLog: (beverage: string, amount: number) => void;
  removeLog: (id: string) => void;
  todayTotal: number;
  dayTotals: Record<string, number>;
  getLogsByDate: (dayKey: string) => IntakeLog[];

  // 알림(특정 시각)
  reminders: Reminder[];
  addDailyReminder: (hour: number, minute: number) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;

  // 커스텀 프리셋
  customPresets: CustomWaterPreset[];
  addPreset: (label: string, amount: number, icon?: string) => Promise<void>;
  removePreset: (id: string) => Promise<void>;
};

const Ctx = createContext<ProfileCtx | null>(null);

// ---------- Provider ----------
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // 프로필
  const [profile, setProfile] = useState<Profile | null>(null);
  // 로그
  const [logs, setLogs] = useState<IntakeLog[]>([]);
  // 알림(특정 시각)
  const [reminders, setReminders] = useState<Reminder[]>([]);
  // 커스텀 프리셋
  const [customPresets, setCustomPresets] = useState<CustomWaterPreset[]>([]);

  // ---- Load from storage on mount ----
  useEffect(() => {
    (async () => {
      try {
        const [p, l, r, c] = await Promise.all([
          AsyncStorage.getItem(KEY_PROFILE),
          AsyncStorage.getItem(KEY_LOGS),
          AsyncStorage.getItem(KEY_REMINDERS),
          AsyncStorage.getItem(KEY_PRESETS),
        ]);
        if (p) setProfile(JSON.parse(p));
        if (l) setLogs(JSON.parse(l));
        if (r) setReminders(JSON.parse(r));
        if (c) setCustomPresets(JSON.parse(c));
      } catch {
        // ignore
      }
    })();
  }, []);

  // ---- Persist on change ----
  useEffect(() => {
    AsyncStorage.setItem(KEY_PROFILE, JSON.stringify(profile ?? null)).catch(() => {});
  }, [profile]);

  useEffect(() => {
    AsyncStorage.setItem(KEY_LOGS, JSON.stringify(logs)).catch(() => {});
  }, [logs]);

  useEffect(() => {
    AsyncStorage.setItem(KEY_REMINDERS, JSON.stringify(reminders)).catch(() => {});
  }, [reminders]);

  useEffect(() => {
    AsyncStorage.setItem(KEY_PRESETS, JSON.stringify(customPresets)).catch(() => {});
  }, [customPresets]);

  // ---- Derived values ----
  const todayKey = ymd(new Date());
  const todayTotal = useMemo(() => {
    return logs
      .filter((l) => ymd(new Date(l.createdAt)) === todayKey)
      .reduce((s, l) => s + l.amount, 0);
  }, [logs, todayKey]);

  const dayTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of logs) {
      const k = ymd(new Date(l.createdAt));
      map[k] = (map[k] ?? 0) + l.amount;
    }
    return map;
  }, [logs]);

  const getLogsByDate = (dayKey: string) =>
    logs.filter((l) => ymd(new Date(l.createdAt)) === dayKey);

  // ---- API impl ----
  const setHW = (heightCm: number, weightKg: number) => {
    const dailyTargetMl = calcDailyWaterTargetMl(weightKg);
    setProfile({ heightCm, weightKg, dailyTargetMl });
  };

  const addLog = (beverage: string, amount: number) => {
    setLogs((prev) => [
      ...prev,
      { id: uuidv4(), beverage, amount, createdAt: Date.now() },
    ]);
  };

  const removeLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  // 알림: 매일 특정 시각 예약
  const addDailyReminder = async (hour: number, minute: number) => {
    const ok = await ensureNotificationPermission();
    if (!ok) throw new Error("알림 권한이 없습니다.");

    const id = await scheduleDailyReminder(
      hour,
      minute,
      "물을 마실 시간이에요 💧"
    );

    setReminders((prev) => [
      ...prev,
      { id, hour, minute },
    ]);
  };

  const removeReminder = async (id: string) => {
    try {
      await cancelReminder(id);
    } finally {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // 커스텀 프리셋
  const addPreset = async (label: string, amount: number, icon: string = "cup") => {
    const preset: CustomWaterPreset = {
      id: `custom-${uuidv4()}`,
      label: label.trim(),
      amount,
      icon,             // ← 항상 존재
      isCustom: true,
    };
    setCustomPresets((prev) => [...prev, preset]);
  };

  const removePreset = async (id: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const api = useMemo<ProfileCtx>(
    () => ({
      profile,
      setHW,

      logs,
      addLog,
      removeLog,
      todayTotal,
      dayTotals,
      getLogsByDate,

      reminders,
      addDailyReminder,
      removeReminder,

      customPresets,
      addPreset,
      removePreset,
    }),
    [
      profile,
      logs,
      todayTotal,
      dayTotals,
      reminders,
      customPresets,
    ]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

// ---------- Hook ----------
export function useProfile() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
