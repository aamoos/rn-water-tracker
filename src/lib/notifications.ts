// /src/lib/notifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// ✅ 앱 실행 중일 때도 알림 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ✅ Android 알림 채널 설정
async function ensureAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "기본 알림",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
  }
}

// ✅ 권한 요청
export async function ensureNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;

  const { status: req } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return req === "granted";
}

/**
 * 매일 특정 시각 반복 알림
 * 예: 매일 10:00 에 알림
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  body: string
) {
  await ensureAndroidChannel();

  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY, // ✅ 반복은 자동
    hour,
    minute,
    channelId: "default",
  };

  return Notifications.scheduleNotificationAsync({
    content: { title: "물마시기 알림", body },
    trigger,
  });
}

/**
 * 일정 간격마다 반복 알림
 * 예: 120분(2시간)마다 알림
 */
export async function scheduleIntervalReminder(
  minutes: number,
  body: string
) {
  await ensureAndroidChannel();

  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: minutes * 60,
    repeats: true, // ✅ interval 은 여전히 필요
    channelId: "default",
  };

  return Notifications.scheduleNotificationAsync({
    content: { title: "물마시기 알림", body },
    trigger,
  });
}

// 예약 취소
export async function cancelReminder(id: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch { }
}
