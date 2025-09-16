import React from "react";
import { View, Text } from "react-native";

type Props = {
  value: number;   // 현재값 (예: todayTotal)
  max: number;     // 최대값 (예: target)
  height?: number; // 바 높이
};

export default function ProgressBar({ value, max, height = 14 }: Props) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          height,
          backgroundColor: "#e9eef3",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${percent}%`,
            height: "100%",
            backgroundColor: "#2f95dc",
          }}
        />
      </View>
      <Text style={{ fontSize: 12, color: "#555" }}>
        {percent}% 달성
      </Text>
    </View>
  );
}
