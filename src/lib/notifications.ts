// /src/lib/notifications.ts
import * as Notifications from "expo-notifications";

// 앱이 켜져 있을 때도 알림을 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 권한 요청
export async function ensureNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;

  // iOS 옵션: announcements 제거
  const { status: req } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return req === "granted";
}

// ✅ 매일 특정 시각 반복 알림 (캘린더 트리거)
export async function scheduleDailyReminder(hour: number, minute: number, body: string) {
  const trigger: Notifications.CalendarTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR, // ← 요게 핵심!
    hour,
    minute,
    repeats: true,
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
  } catch {}
}
