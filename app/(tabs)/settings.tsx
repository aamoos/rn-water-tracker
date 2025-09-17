// app/(tabs)/settings.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { useProfile } from "../../src/store/profile";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

export default function Settings() {
  const router = useRouter();
  const { profile, setHW, reminders, addDailyReminder, removeReminder } =
    useProfile();

  // ✅ 키 state/검증 제거 → 몸무게만 관리
  const [weight, setWeight] = useState(
    profile?.weightKg ? String(profile.weightKg) : ""
  );

  // 시간 선택기 상태
  const [showPicker, setShowPicker] = useState(false);
  const [pickTime, setPickTime] = useState<Date>(new Date());

  const onSave = () => {
    const w = Number(weight);
    if (!w || w <= 0) {
      Alert.alert("확인", "몸무게를 숫자로 입력해주세요.");
      return;
    }
    // ✅ 기존에 저장된 키 값 유지 (없으면 0)
    const h = Number(profile?.heightCm ?? 0);
    setHW(h, w);
    router.replace("/");
  };

  // 빠른 추가(프리셋 시간)
  const quickAdd = async (hour: number, minute: number) => {
    try {
      await addDailyReminder(hour, minute);
    } catch (e: any) {
      Alert.alert("알림", e?.message ?? "알림을 추가할 수 없습니다.");
    }
  };

  // 시간 선택기 onChange
  const onTimeChange = async (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      // 안드로이드: 한 번에 팝업. 'set' 이벤트면 확정으로 간주.
      if (event.type === "set" && date) {
        setShowPicker(false);
        try {
          await addDailyReminder(date.getHours(), date.getMinutes());
        } catch (e: any) {
          Alert.alert("알림", e?.message ?? "알림 추가 실패");
        }
      } else {
        setShowPicker(false);
      }
    } else {
      // iOS: 스피너 값만 갱신하고 별도 버튼으로 확정
      if (date) setPickTime(date);
    }
  };

  // iOS에서 선택한 시간 확정 추가
  const addPickedTime = async () => {
    try {
      await addDailyReminder(pickTime.getHours(), pickTime.getMinutes());
      setShowPicker(false); // ✅ 추가 후 닫기
    } catch (e: any) {
      Alert.alert("알림", e?.message ?? "알림 추가 실패");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>프로필 설정</Text>

      <Text>몸무게 (kg)</Text>
      <TextInput
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholder="예: 72"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 12,
          borderRadius: 8,
        }}
      />

      <Pressable
        onPress={onSave}
        style={{
          backgroundColor: "#2f95dc",
          padding: 14,
          borderRadius: 10,
          marginTop: 8,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 16 }}>
          저장
        </Text>
      </Pressable>

      {/* ---- 알림 영역 ---- */}
      <View style={{ marginTop: 24, gap: 10 }}>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>알림 시간</Text>
        <Text style={{ color: "#666" }}>매일 특정 시간에 알림을 받습니다.</Text>

        {/* ✅ 사용자 지정 시간 추가 */}
        <View style={{ gap: 8, marginTop: 6 }}>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#2f95dc",
              backgroundColor: "white",
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: "#2f95dc", fontWeight: "600" }}>
              시간 직접 추가
            </Text>
          </Pressable>
        </View>

        {/* 모달 형태의 피커 */}
        <Modal
          transparent
          animationType="slide"
          visible={showPicker}
          onRequestClose={() => setShowPicker(false)}
        >
          {/* 반투명 오버레이 */}
          <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.35)",
                justifyContent: "flex-end",
              }}
            >
              {/* 아래쪽 카드 */}
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
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      marginBottom: 8,
                    }}
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

                  {/* 액션 버튼 */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    <Pressable
                      onPress={() => setShowPicker(false)}
                      style={{ padding: 10 }}
                    >
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
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "600",
                          }}
                        >
                          {`${String(pickTime.getHours()).padStart(
                            2,
                            "0"
                          )}:${String(pickTime.getMinutes()).padStart(
                            2,
                            "0"
                          )} 추가`}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* 빠른 추가 프리셋 */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
                <Text
                  style={{
                    color: "#2f95dc",
                    fontWeight: "600",
                  }}
                >
                  {String(t.h).padStart(2, "0")}:
                  {String(t.m).padStart(2, "0")} 추가
                </Text>
              </Pressable>
            )
          )}
        </View>

        {/* 예약된 알림 목록 */}
        <View style={{ marginTop: 8, gap: 8 }}>
          {reminders.length === 0 ? (
            <Text style={{ color: "#888" }}>등록된 알림이 없습니다.</Text>
          ) : (
            reminders.map((r) => (
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
    </View>
  );
}
