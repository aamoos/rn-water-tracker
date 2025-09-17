// /src/data/water.ts
// 기본 제공되는 물 프리셋만 정의
// (커스텀 프리셋은 store/profile.ts에서 관리)

export type WaterPreset = {
  id: string;
  label: string;
  amount: number;
  icon: string; // string으로 풀어줌 (MaterialCommunityIcons에서 렌더링 시 any 캐스팅)
};

export const WATER_PRESETS: WaterPreset[] = [
  { id: "cup200", label: "컵 (200ml)", amount: 200, icon: "cup" },
  { id: "bottle500", label: "생수병 (500ml)", amount: 500, icon: "bottle-soda" },
  { id: "mug300", label: "머그컵 (300ml)", amount: 300, icon: "cup-outline" },
];
