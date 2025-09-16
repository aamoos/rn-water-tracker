import React, { useMemo, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { Calendar } from "react-native-calendars";

import { useProfile } from "../../src/store/profile";
import { ymd } from "../../src/lib/date";

// 설치: npm i react-native-calendars
// (Expo에서 별도 native 빌드 없이 동작)

type RNCalDateObject = {
  dateString: string; // "YYYY-MM-DD"
  day: number;
  month: number;
  year: number;
  timestamp?: number;
};

export default function CalendarTab() {
  const { profile, dayTotals, getLogsByDate } = useProfile();
  const target = profile?.dailyTargetMl ?? 0;

  // 기본 선택: 오늘
  const todayKey = ymd(new Date());
  const [selected, setSelected] = useState<string>(todayKey);

  
  // 달력 표시(달성/미달 마킹)
  const marked = useMemo(() => {
    const m: Record<string, any> = {};
    Object.entries(dayTotals).forEach(([day, total]) => {
      const achieved = target > 0 && total >= target;
      m[day] = {
        marked: true,
        dotColor: achieved ? "#2ecc71" : "#bdc3c7",
      };
    });
    if (!m[selected]) m[selected] = {};
    m[selected] = { ...(m[selected] || {}), selected: true, selectedColor: "#2f95dc" };
    return m;
  }, [dayTotals, selected, target]);

  const logs = getLogsByDate(selected);
  const dayTotal = dayTotals[selected] ?? 0;
  const percent = target > 0 ? Math.min(100, Math.round((dayTotal / target) * 100)) : 0;

  const onDayPress = (d: RNCalDateObject) => setSelected(d.dateString); // YYYY-MM-DD

  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>달력</Text>

      <Calendar
        markedDates={marked}
        onDayPress={onDayPress}
        theme={{
          todayTextColor: "#2f95dc",
          selectedDayBackgroundColor: "#2f95dc",
          arrowColor: "#2f95dc",
        }}
      />

      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 16, fontWeight: "700" }}>{selected} 요약</Text>
        <Text style={{ color: "#555" }}>
          합계 {dayTotal.toLocaleString()} ml
          {target > 0 ? ` / 목표 ${target.toLocaleString()} ml (${percent}%)` : ""}
        </Text>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        ListEmptyComponent={
          <Text style={{ color: "#888", marginTop: 8 }}>기록이 없습니다.</Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#eee",
              borderRadius: 10,
              padding: 12,
              marginVertical: 6,
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              {item.beverage} +{item.amount}ml
            </Text>
            <Text style={{ color: "#666", marginTop: 4 }}>
              {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
