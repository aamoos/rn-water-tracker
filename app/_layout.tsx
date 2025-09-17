// app/_layout.tsx
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { ProfileProvider } from "../src/store/profile";
import "../src/lib/calendar-locale"; // ✅ 로케일 설정 로드
import 'react-native-get-random-values';
import { initializeAdMob, InterstitialAdManager, RewardedAdManager } from "../src/lib/admob";


export default function RootLayout() {
  useEffect(() => {
    // AdMob 초기화 및 광고 미리 로드
    const initAds = async () => {
      const initialized = await initializeAdMob();
      if (initialized) {
        // 전면 광고와 리워드 광고 미리 로드
        InterstitialAdManager.getInstance().loadAd();
        RewardedAdManager.getInstance().loadAd();
      }
    };

    initAds();
  }, []);

  return (
    <ProfileProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* (tabs) 그룹 자체 헤더 비활성화 */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ProfileProvider>
  );
}
