// app/(tabs)/settings.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useProfile } from "../../src/store/profile";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ensureNotificationPermission,
  scheduleIntervalReminder,
  cancelReminder,
} from "../../src/lib/notifications";
import { RewardedAdManager } from "../../src/lib/admob";

type Mode = "off" | "time" | "interval";

// AsyncStorage 키 (간격 알림 전용)
const INTERVAL_KEY = "wt.interval.config"; // {minutes:number, notifId:string}

// 간단 라디오/세그먼트 버튼
function SegButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? "#2f95dc" : "#ddd",
        backgroundColor: active ? "#eaf6ff" : "white",
      }}
    >
      <Text style={{ color: active ? "#2f95dc" : "#333", fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  const { profile, setHW, reminders, addDailyReminder, removeReminder } =
    useProfile();

  // --- 프로필(몸무게) ---
  const [weight, setWeight] = useState(
    profile?.weightKg ? String(profile.weightKg) : ""
  );

  // --- 프리미엄 기능 ---
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);

  // 프리미엄 잠금 해제 확인
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const unlocked = await AsyncStorage.getItem("premium_unlocked");
        setIsPremiumUnlocked(unlocked === "true");
      } catch (e) {
        // ignore
      }
    };
    checkPremium();
  }, []);

  // 리워드 광고 시청하여 프리미엄 기능 잠금 해제
  const unlockPremiumWithAd = async () => {
    const adManager = RewardedAdManager.getInstance();

    if (!adManager.isAdLoaded()) {
      Alert.alert("광고 준비 중", "잠시 후 다시 시도해주세요.");
      return;
    }

    try {
      const result = await adManager.showAd();

      if (result.showed && result.rewarded) {
        // 리워드 받음 - 프리미엄 기능 잠금 해제
        await AsyncStorage.setItem("premium_unlocked", "true");
        setIsPremiumUnlocked(true);
        Alert.alert(
          "🎉 잠금 해제 완료!",
          "프리미엄 테마가 잠금 해제되었습니다!"
        );
      } else if (result.showed && !result.rewarded) {
        Alert.alert("광고 시청 완료", "광고를 끝까지 시청해야 보상을 받을 수 있습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "광고 시청 중 문제가 발생했습니다.");
    }
  };

  const onSaveProfile = () => {
    const w = Number(weight);
    if (!w || w <= 0) {
      Alert.alert("확인", "몸무게를 숫자로 입력해주세요.");
      return;
    }
    const h = Number(profile?.heightCm ?? 0); // 기존 키 유지
    setHW(h, w);
    router.replace("/"); // 저장 후 홈으로
  };

  // --- 알림 모드/상태 ---
  const [mode, setMode] = useState<Mode>("off");

  // 시간 선택기
  const [showPicker, setShowPicker] = useState(false);
  const [pickTime, setPickTime] = useState<Date>(new Date());

  // 간격(분) 설정
  const INTERVAL_OPTIONS = [60, 90, 120, 180] as const;
  const [intervalMinutes, setIntervalMinutes] = useState<number>(120);
  const [intervalNotifId, setIntervalNotifId] = useState<string | null>(null);

  // 초기 복원
  useEffect(() => {
    (async () => {
      try {
        // 간격 알림 복원
        const raw = await AsyncStorage.getItem(INTERVAL_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { minutes: number; notifId: string };
          setIntervalMinutes(parsed.minutes);
          setIntervalNotifId(parsed.notifId);
        }
        // 모드 결정: 간격 예약이 있으면 interval, 아니면 시간 예약이 있으면 time, 둘 다 없으면 off
        if (raw) {
          setMode("interval");
        } else if (reminders.length > 0) {
          setMode("time");
        } else {
          setMode("off");
        }
      } catch (e) {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 모드 전환 핸들러
  const onChangeMode = async (next: Mode) => {
    if (next === mode) return;
    // 전환 정책:
    // interval → time 로 전환 시: 간격 알림 취소
    // time → interval 로 전환 시: 시간 알림 전체 취소
    try {
      if (next === "off") {
        await turnOffAll();
      } else if (next === "time") {
        // 간격 꺼두기
        await stopIntervalReminder();
      } else if (next === "interval") {
        // 시간 알림 전부 제거
        await removeAllTimeReminders();
      }
      setMode(next);
    } catch (e: any) {
      Alert.alert("알림", e?.message ?? "모드 전환 중 오류가 발생했습니다.");
    }
  };

  // 전체 끄기
  const turnOffAll = async () => {
    await stopIntervalReminder();
    await removeAllTimeReminders();
  };

  // 모든 시간 알림 제거
  const removeAllTimeReminders = async () => {
    if (!reminders.length) return;
    const promises = reminders.map((r) => removeReminder(r.id));
    await Promise.allSettled(promises);
  };

  // 간격 알림 시작
  const startIntervalReminder = async (minutes: number) => {
    const ok = await ensureNotificationPermission();
    if (!ok) {
      Alert.alert("알림", "알림 권한이 없습니다.");
      return;
    }
    // 기존 예약이 있으면 정리
    if (intervalNotifId) {
      try {
        await cancelReminder(intervalNotifId);
      } catch { }
    }
    const id = await scheduleIntervalReminder(minutes, "물을 마실 시간이에요 💧");
    setIntervalNotifId(id);
    await AsyncStorage.setItem(
      INTERVAL_KEY,
      JSON.stringify({ minutes, notifId: id })
    );
    setMode("interval");
  };

  // 간격 알림 중지
  const stopIntervalReminder = async () => {
    if (intervalNotifId) {
      try {
        await cancelReminder(intervalNotifId);
      } catch { }
    }
    setIntervalNotifId(null);
    await AsyncStorage.removeItem(INTERVAL_KEY);
  };

  // 시간 선택기(특정 시각) 변경
  const onTimeChange = async (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "set" && date) {
        setShowPicker(false);
        try {
          await addDailyReminder(date.getHours(), date.getMinutes());
          setMode("time");
        } catch (e: any) {
          Alert.alert("알림", e?.message ?? "알림 추가 실패");
        }
      } else {
        setShowPicker(false);
      }
    } else {
      if (date) setPickTime(date);
    }
  };

  // iOS에서 선택 확정
  const addPickedTime = async () => {
    try {
      await addDailyReminder(pickTime.getHours(), pickTime.getMinutes());
      setShowPicker(false);
      setMode("time");
    } catch (e: any) {
      Alert.alert("알림", e?.message ?? "알림 추가 실패");
    }
  };

  // 빠른 프리셋 추가
  const quickAdd = async (h: number, m: number) => {
    try {
      await addDailyReminder(h, m);
      setMode("time");
    } catch (e: any) {
      Alert.alert("알림", e?.message ?? "알림을 추가할 수 없습니다.");
    }
  };

  // 요약 텍스트
  const summaryText = useMemo(() => {
    if (mode === "off") return "알림이 꺼져 있습니다.";
    if (mode === "interval") {
      return intervalNotifId
        ? `간격 알림: ${intervalMinutes}분마다`
        : "간격 알림: 설정되지 않음";
    }
    // time
    if (!reminders.length) return "등록된 알림이 없습니다.";
    const items = [...reminders]
      .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
      .map(
        (r) =>
          `${String(r.hour).padStart(2, "0")}:${String(r.minute).padStart(2, "0")}`
      );
    return `매일 ${items.join(" / ")}`;
  }, [mode, reminders, intervalMinutes, intervalNotifId]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
      {/* --- 프로필 --- */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>프로필 설정</Text>

        <Text>몸무게 (kg)</Text>
        <TextInput
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="예: 72"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 8,
          }}
        />

        <Pressable
          onPress={onSaveProfile}
          style={{
            backgroundColor: "#2f95dc",
            padding: 14,
            borderRadius: 10,
            marginTop: 4,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontSize: 16 }}>
            저장
          </Text>
        </Pressable>
      </View>

      {/* --- 알림 설정 --- */}
      <View style={{ gap: 12, marginTop: 10 }}>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>알림</Text>
        <Text style={{ color: "#666" }}>{summaryText}</Text>

        {/* 모드 선택 세그먼트 */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
          <SegButton
            label="끄기"
            active={mode === "off"}
            onPress={() => onChangeMode("off")}
          />
          <SegButton
            label="특정 시각"
            active={mode === "time"}
            onPress={() => onChangeMode("time")}
          />
          <SegButton
            label="간격"
            active={mode === "interval"}
            onPress={() => onChangeMode("interval")}
          />
        </View>

        {/* --- 특정 시각 모드 --- */}
        {mode === "time" && (
          <View style={{ gap: 10, marginTop: 8 }}>
            <Text style={{ fontWeight: "600" }}>시간 추가</Text>

            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {[{ h: 9, m: 30 }, { h: 11, m: 30 }, { h: 14, m: 0 }, { h: 17, m: 0 }].map(
                (t) => (
                  <Pressable
                    key={`${t.h}:${t.m}`}
                    onPress={() => quickAdd(t.h, t.m)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "#2f95dc",
                      backgroundColor: "white",
                    }}
                  >
                    <Text style={{ color: "#2f95dc", fontWeight: "600" }}>
                      {String(t.h).padStart(2, "0")}:{String(t.m).padStart(2, "0")} 추가
                    </Text>
                  </Pressable>
                )
              )}

              <Pressable
                onPress={() => setShowPicker(true)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "#2f95dc",
                  backgroundColor: "white",
                }}
              >
                <Text style={{ color: "#2f95dc", fontWeight: "600" }}>시간 직접 추가</Text>
              </Pressable>
            </View>

            {/* 등록된 알림 목록 */}
            <View style={{ gap: 8 }}>
              {reminders.length === 0 ? (
                <Text style={{ color: "#888" }}>등록된 알림이 없습니다.</Text>
              ) : (
                [...reminders]
                  .sort(
                    (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)
                  )
                  .map((r) => (
                    <View
                      key={r.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderWidth: 1,
                        borderColor: "#eee",
                        borderRadius: 10,
                        padding: 12,
                        backgroundColor: "#fff",
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>
                        {String(r.hour).padStart(2, "0")}:
                        {String(r.minute).padStart(2, "0")} 매일
                      </Text>
                      <Pressable
                        onPress={() => removeReminder(r.id)}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          backgroundColor: "#eee",
                          borderRadius: 8,
                        }}
                      >
                        <Text>삭제</Text>
                      </Pressable>
                    </View>
                  ))
              )}
            </View>
          </View>
        )}

        {/* --- 간격 모드 --- */}
        {mode === "interval" && (
          <View style={{ gap: 12, marginTop: 8 }}>
            <Text style={{ fontWeight: "600" }}>간격 선택 (분)</Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {INTERVAL_OPTIONS.map((m) => {
                const active = intervalMinutes === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setIntervalMinutes(m)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? "#2f95dc" : "#ddd",
                      backgroundColor: active ? "#eaf6ff" : "white",
                    }}
                  >
                    <Text
                      style={{
                        color: active ? "#2f95dc" : "#333",
                        fontWeight: "600",
                      }}
                    >
                      {m}분
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={async () => {
                  const ok = await ensureNotificationPermission();
                  if (!ok) {
                    Alert.alert("알림", "알림 권한이 없습니다.");
                    return;
                  }
                  await startIntervalReminder(intervalMinutes);
                  Alert.alert("알림", `${intervalMinutes}분마다 알림이 설정되었습니다.`);
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: "#2f95dc",
                }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>시작</Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  await stopIntervalReminder();
                  Alert.alert("알림", "간격 알림이 중지되었습니다.");
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  backgroundColor: "white",
                }}
              >
                <Text style={{ color: "#333", fontWeight: "700" }}>중지</Text>
              </Pressable>
            </View>

            <Text style={{ color: "#666" }}>
              {intervalNotifId
                ? `현재: ${intervalMinutes}분마다 동작 중`
                : "현재: 동작 중인 간격 알림이 없습니다."}
            </Text>
          </View>
        )}

        {/* --- TimePicker 모달 (특정 시각 모드에서 사용) --- */}
        <Modal
          transparent
          animationType="slide"
          visible={showPicker}
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.35)",
                justifyContent: "flex-end",
              }}
            >
              <TouchableWithoutFeedback onPress={() => { }}>
                <View
                  style={{
                    backgroundColor: "white",
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    padding: 16,
                  }}
                >
                  <Text
                    style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}
                  >
                    알림 시간 선택
                  </Text>

                  <DateTimePicker
                    mode="time"
                    value={pickTime}
                    onChange={onTimeChange}
                    is24Hour={true}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    themeVariant="light"
                  />

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    <Pressable onPress={() => setShowPicker(false)} style={{ padding: 10 }}>
                      <Text style={{ color: "#666" }}>취소</Text>
                    </Pressable>

                    {Platform.OS === "ios" && (
                      <Pressable
                        onPress={addPickedTime}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          backgroundColor: "#2f95dc",
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: "white", fontWeight: "600" }}>
                          {`${String(pickTime.getHours()).padStart(2, "0")}:${String(
                            pickTime.getMinutes()
                          ).padStart(2, "0")} 추가`}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>

      {/* --- 프리미엄 기능 --- */}
      <View style={{ gap: 12, marginTop: 10 }}>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>프리미엄 기능</Text>

        {isPremiumUnlocked ? (
          <View style={{
            padding: 16,
            backgroundColor: "#e8f5e8",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#4caf50"
          }}>
            <Text style={{ color: "#2e7d32", fontWeight: "600", textAlign: "center" }}>
              🎉 프리미엄 테마가 잠금 해제되었습니다!
            </Text>
            <Text style={{ color: "#2e7d32", textAlign: "center", marginTop: 4 }}>
              앞으로 더 많은 프리미엄 기능을 이용하실 수 있어요.
            </Text>
          </View>
        ) : (
          <View style={{
            padding: 16,
            backgroundColor: "#fff3e0",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ff9800"
          }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
              🎨 프리미엄 테마 잠금 해제
            </Text>
            <Text style={{ color: "#666", marginBottom: 12 }}>
              광고를 시청하고 아름다운 프리미엄 테마를 무료로 이용하세요!
            </Text>

            <Pressable
              onPress={unlockPremiumWithAd}
              style={{
                backgroundColor: "#ff9800",
                padding: 12,
                borderRadius: 8,
                alignItems: "center"
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                📺 광고 시청하고 잠금 해제
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
