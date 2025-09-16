import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useProfile } from "../../src/store/profile";

export default function Settings() {
  const router = useRouter();
  const { profile, setHW, reminders, addDailyReminder, removeReminder } = useProfile();

  const [height, setHeight] = useState(
    profile?.heightCm ? String(profile.heightCm) : ""
  );
  const [weight, setWeight] = useState(
    profile?.weightKg ? String(profile.weightKg) : ""
  );

  const onSave = () => {
    const h = Number(height);
    const w = Number(weight);
    if (!w || !h || w <= 0 || h <= 0) {
      Alert.alert("확인", "키/몸무게를 숫자로 입력해주세요.");
      return;
    }
    setHW(h, w);
    router.replace("/");
  };

  const quickAdd = async (hour: number, minute: number) => {
    try {
      await addDailyReminder(hour, minute);
    } catch (e: any) {
      Alert.alert("알림", e?.message ?? "알림을 추가할 수 없습니다.");
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
        <Text style={{ color: "#666" }}>
          아래 버튼을 눌러 매일 같은 시간에 알림을 추가하세요.
        </Text>

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
                <Text style={{ color: "#2f95dc", fontWeight: "600" }}>
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
