import React, { useMemo } from "react";
import { View, Text, Dimensions, ScrollView } from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { useProfile } from "../../src/store/profile";
import { ymd } from "../../src/lib/date";

const screenWidth = Dimensions.get("window").width;

export default function StatsTab() {
    const { dayTotals, profile } = useProfile();
    const target = profile?.dailyTargetMl ?? 0;

    // 최근 7일 데이터
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        const key = ymd(d);
        return { date: key.slice(5), total: dayTotals[key] ?? 0 }; // MM-DD
    });

    // 최근 30일 데이터
    const last30Days = Array.from({ length: 30 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (29 - i));
        const key = ymd(d);
        return { date: key.slice(5), total: dayTotals[key] ?? 0 };
    });

    return (
        <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 16 }}>
                통계
            </Text>

            {/* 7일간 진행 */}
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
                최근 7일 (목표 {target ? `${target}ml` : "미설정"})
            </Text>
            <BarChart
                data={{
                    labels: last7Days.map((d) => d.date),
                    datasets: [{ data: last7Days.map((d) => d.total) }],
                }}
                width={screenWidth - 64}
                height={220}
                yAxisSuffix="ml"
                chartConfig={{
                    backgroundColor: "#fff",
                    backgroundGradientFrom: "#f9f9f9",
                    backgroundGradientTo: "#f9f9f9",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(47, 149, 220, ${opacity})`,
                    labelColor: () => "#555",
                }}
                style={{ borderRadius: 12, marginBottom: 24 }}
            />

            {/* 30일간 추세 */}
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
                최근 30일 추세
            </Text>
            <LineChart
                data={{
                    labels: last30Days.filter((_, i) => i % 5 === 0).map((d) => d.date),
                    datasets: [{ data: last30Days.map((d) => d.total) }],
                }}
                width={screenWidth - 64}
                height={220}
                yAxisSuffix="ml"
                chartConfig={{
                    backgroundColor: "#fff",
                    backgroundGradientFrom: "#f9f9f9",
                    backgroundGradientTo: "#f9f9f9",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(47, 149, 220, ${opacity})`,
                    labelColor: () => "#555",
                }}
                bezier
                style={{ borderRadius: 12 }}
            />
        </ScrollView>
    );
}
