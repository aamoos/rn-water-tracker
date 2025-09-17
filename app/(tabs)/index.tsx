// app/(tabs)/index.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useProfile } from "../../src/store/profile";
import ProgressBar from "../../src/components/ProgressBar";
import { WATER_PRESETS } from "../../src/data/water";
import type { WaterPreset as BasePreset } from "../../src/data/water";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ymd } from "../../src/lib/date";
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS, InterstitialAdManager } from "../../src/lib/admob";

type Preset = BasePreset & { isCustom: boolean };

export default function Home() {
  const router = useRouter();
  const {
    profile,
    todayTotal,
    addLog,
    getLogsByDate,
    removeLog,
    customPresets,
    addPreset,
    removePreset,
  } = useProfile();

  const target = profile?.dailyTargetMl ?? 0;
  const todayKey = ymd(new Date());
  const todayLogs = getLogsByDate(todayKey);

  // 목표 달성 여부 확인 및 광고 표시
  const checkGoalCompletion = async (newTotal: number) => {
    const wasGoalReached = todayTotal >= target;
    const isGoalReached = newTotal >= target;

    // 목표를 새로 달성했을 때만 광고 표시
    if (!wasGoalReached && isGoalReached && target > 0) {
      setTimeout(async () => {
        Alert.alert(
          "🎉 목표 달성!",
          `오늘 목표인 ${target.toLocaleString()}ml를 달성했어요!`,
          [
            {
              text: "확인",
              onPress: async () => {
                // 전면 광고 표시
                const adManager = InterstitialAdManager.getInstance();
                if (adManager.isAdLoaded()) {
                  await adManager.showAd();
                }
              }
            }
          ]
        );
      }, 500); // 약간의 지연을 두어 UI 업데이트 후 알림 표시
    }
  };

  // 프리셋 클릭 → 기록 추가
  const onAdd = (amount: number) => {
    if (!profile || (profile.dailyTargetMl ?? 0) <= 0) {
      Alert.alert(
        "프로필이 필요해요",
        "몸무게를 입력하면 하루 권장 섭취량을 계산해드릴게요.",
        [
          { text: "취소" },
          { text: "지금 설정", onPress: () => router.push("/(tabs)/settings") },
        ]
      );
      return;
    }

    const newTotal = todayTotal + amount;
    addLog("물", amount);

    // 목표 달성 확인 및 광고 표시
    checkGoalCompletion(newTotal);
  };

  // ---------- 내 컵 추가 모달 ----------
  const [showAdd, setShowAdd] = useState(false);
  const [cupLabel, setCupLabel] = useState("");
  const [cupAmount, setCupAmount] = useState("");

  const onSaveCup = async () => {
    const amt = Number(cupAmount);
    if (!amt || amt <= 0) {
      Alert.alert("확인", "용량(ml)을 숫자로 입력해주세요.");
      return;
    }
    const label = (cupLabel || `${amt}ml 컵`).trim();
    try {
      await addPreset(label, amt, "cup");
      setShowAdd(false);
      setCupLabel("");
      setCupAmount("");
    } catch (e: any) {
      Alert.alert("오류", e?.message ?? "프리셋을 추가할 수 없습니다.");
    }
  };

  // 기본 + 사용자 프리셋 합치기
  const presets: Preset[] = useMemo(
    () => [
      ...WATER_PRESETS.map((p) => ({ ...p, isCustom: false } as Preset)),
      ...customPresets.map((p) => ({ ...p, isCustom: true } as Preset)),
    ],
    [customPresets]
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={todayLogs}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListHeaderComponent={
          <View>
            {/* 상단 목표 */}
            <View style={{ padding: 20, paddingBottom: 12 }}>
              <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
                오늘 섭취 / 목표
              </Text>
              <Text style={{ fontSize: 18, marginBottom: 12 }}>
                {`${todayTotal.toLocaleString()} ml`}
                {target > 0
                  ? ` / ${target.toLocaleString()} ml`
                  : " (목표 미설정)"}
              </Text>
              <ProgressBar value={todayTotal} max={target} />
            </View>

            {/* 프리셋 카드 */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingBottom: 8,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {/* 내 컵 추가 */}
              <Pressable
                onPress={() => setShowAdd(true)}
                style={{
                  flexBasis: "48%",
                  maxWidth: "48%",
                  backgroundColor: "#fff",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#2f95dc",
                }}
              >
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={50}
                  color="#2f95dc"
                />
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#2f95dc",
                  }}
                >
                  내 컵 추가
                </Text>
                <Text style={{ marginTop: 2, fontSize: 12, color: "#666" }}>
                  나만의 ml 프리셋 저장
                </Text>
              </Pressable>

              {/* 프리셋 카드 */}
              {presets.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flexBasis: "48%",
                    maxWidth: "48%",
                    backgroundColor: "#f6f8fa",
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: item.isCustom ? "#cfe7ff" : "#eee",
                    position: "relative",
                  }}
                >
                  {/* 삭제 버튼 (커스텀만) */}
                  {item.isCustom && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert(
                        "삭제",
                        `"${item.label}" 프리셋을 삭제할까요?`,
                        [
                          { text: "취소" },
                          {
                            text: "삭제",
                            style: "destructive",
                            onPress: () => removePreset(item.id),
                          },
                        ]
                      )
                    }}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      backgroundColor: "#ffcccc",
                      borderRadius: 6,
                      paddingVertical: 2,
                      paddingHorizontal: 6,
                      zIndex: 1,
                    }}
                  >
                    <Text style={{ color: "#c0392b", fontSize: 12, fontWeight: "700" }}>
                      삭제
                    </Text>
                  </Pressable>
                )}

                  <Pressable
                    onPress={() => onAdd(item.amount)}
                    style={{ alignItems: "center" }}
                  >
                    <MaterialCommunityIcons
                      name={(item.icon || "cup") as any}
                      size={50}
                      color="#2f95dc"
                    />
                    <Text
                      style={{ marginTop: 8, fontSize: 16, fontWeight: "600" }}
                    >
                      {item.label}
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 12, color: "#666" }}>
                      {item.amount} ml
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {/* 오늘 기록 제목 */}
            <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 6 }}>
                오늘 기록
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ color: "#888", paddingHorizontal: 20 }}>
            아직 기록이 없어요.
          </Text>
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
              marginHorizontal: 20,
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
        ListFooterComponent={
          <View>
            {/* 배너 광고 */}
            <View style={{
              alignItems: 'center',
              marginVertical: 16,
              paddingHorizontal: 20
            }}>
              <BannerAd
                unitId={AD_UNIT_IDS.banner}
                size={BannerAdSize.BANNER}
                requestOptions={{
                  requestNonPersonalizedAdsOnly: false,
                }}
                onAdLoaded={() => console.log('Banner ad loaded')}
                onAdFailedToLoad={(error) => console.error('Banner ad failed to load:', error)}
              />
            </View>

            <Pressable
              onPress={() => router.push("/(tabs)/settings")}
              style={{ marginTop: 8, marginBottom: 24 }}
            >
              <Text style={{ color: "gray", textAlign: "center" }}>
                프로필 수정
              </Text>
            </Pressable>
          </View>
        }
      />

      {/* 내 컵 추가 모달 */}
      <Modal
        transparent
        animationType="fade"
        visible={showAdd}
        onRequestClose={() => setShowAdd(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 16,
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700" }}>내 컵 추가</Text>

            <Text>이름(선택)</Text>
            <TextInput
              value={cupLabel}
              onChangeText={setCupLabel}
              placeholder="예: 내 머그컵"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 10,
                borderRadius: 8,
              }}
            />

            <Text>용량(ml)</Text>
            <TextInput
              value={cupAmount}
              onChangeText={setCupAmount}
              placeholder="예: 250"
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 10,
                borderRadius: 8,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 6,
              }}
            >
              <Pressable onPress={() => setShowAdd(false)} style={{ padding: 10 }}>
                <Text style={{ color: "#666" }}>취소</Text>
              </Pressable>
              <Pressable
                onPress={onSaveCup}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: "#2f95dc",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>저장</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
