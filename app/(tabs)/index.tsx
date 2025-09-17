import React from "react";
import { View, Text, Pressable, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useProfile } from "../../src/store/profile";
import ProgressBar from "../../src/components/ProgressBar";
import { WATER_PRESETS } from "../../src/data/water";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ymd } from "../../src/lib/date";

export default function Home() {
  const router = useRouter();
  const { profile, todayTotal, addLog, getLogsByDate, removeLog } = useProfile();
  const target = profile?.dailyTargetMl ?? 0;

  const todayKey = ymd(new Date());
  const todayLogs = getLogsByDate(todayKey);

  // ✅ 프리셋 탭 시: 프로필(몸무게/권장량) 없으면 설정 유도
  const onAdd = (amount: number) => {
    if (!profile || !profile.weightKg || !profile.dailyTargetMl) {
      Alert.alert(
        "프로필이 필요해요",
        "몸무게를 입력하면 하루 권장 섭취량을 계산해드릴게요.",
        [
          { text: "취소" },
          {
            text: "지금 설정",
            onPress: () => router.push("/(tabs)/settings"),
          },
        ]
      );
      return;
    }
    addLog("물", amount);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 상단 헤더 영역 (고정) */}
      <View style={{ padding: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
          오늘 섭취 / 목표
        </Text>
        <Text style={{ fontSize: 18, marginBottom: 12 }}>
          {`${todayTotal.toLocaleString()} ml`}
          {target > 0 ? ` / ${target.toLocaleString()} ml` : " (목표 미설정)"}
        </Text>
        <ProgressBar value={todayTotal} max={target} />
      </View>

      {/* 물 프리셋 카드 그리드 (고정, 스크롤되지 않음) */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {WATER_PRESETS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onAdd(item.amount)} // ✅ 여기서 체크
            style={{
              flexBasis: "48%", // 2열
              maxWidth: "48%",
              backgroundColor: "#f6f8fa",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#eee",
            }}
          >
            <MaterialCommunityIcons name={item.icon as any} size={50} color="#2f95dc" />
            <Text style={{ marginTop: 8, fontSize: 16, fontWeight: "600" }}>
              {item.label}
            </Text>
            <Text style={{ marginTop: 2, fontSize: 12, color: "#666" }}>
              탭하여 추가
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 아래 영역만 스크롤: 오늘 기록 리스트 */}
      <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 6 }}>
          오늘 기록
        </Text>

        <FlatList
          style={{ flex: 1 }} // ⬅️ 이 리스트만 스크롤
          data={todayLogs}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={{ color: "#888" }}>아직 기록이 없어요.</Text>
          }
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: "#eee",
                backgroundColor: "#fff",
                padding: 12,
                borderRadius: 10,
                marginVertical: 4,
              }}
            >
              <View>
                <Text style={{ fontSize: 16, fontWeight: "600" }}>
                  물 +{item.amount}ml
                </Text>
                <Text style={{ color: "#666", marginTop: 2 }}>
                  {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
              </View>

              <Pressable
                onPress={() => removeLog(item.id)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: "#ffe9e9",
                  borderWidth: 1,
                  borderColor: "#ffcdcd",
                }}
              >
                <Text style={{ color: "#c0392b", fontWeight: "700" }}>삭제</Text>
              </Pressable>
            </View>
          )}
        />
      </View>

      {/* 프로필 이동 */}
      <Pressable onPress={() => router.push("/(tabs)/settings")} style={{ marginBottom: 12 }}>
        <Text style={{ color: "gray", textAlign: "center" }}>프로필 수정</Text>
      </Pressable>
    </View>
  );
}
