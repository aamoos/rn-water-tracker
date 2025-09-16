// app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { ProfileProvider } from "../src/store/profile";
import "../src/lib/calendar-locale"; // ✅ 로케일 설정 로드

export default function RootLayout() {
  return (
    <ProfileProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* (tabs) 그룹 자체 헤더 비활성화 */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ProfileProvider>
  );
}
