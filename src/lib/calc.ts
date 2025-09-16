// 물 권장량: 몸무게*30ml, 최소 1500, 최대 4000
export function calcDailyWaterTargetMl(weightKg: number) {
  const raw = Math.round(weightKg * 30);
  return Math.min(4000, Math.max(1500, raw));
}