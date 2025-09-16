export type WaterPreset = {
  id: string;
  label: string;   // ex) "200 ml"
  amount: number;  // ex) 200
  icon: string;    // MaterialCommunityIcons 아이콘 이름
};

export const WATER_PRESETS: WaterPreset[] = [
  { id: "w200", label: "200 ml", amount: 200, icon: "cup-water" },
  { id: "w250", label: "250 ml", amount: 250, icon: "cup-water" },
  { id: "w300", label: "300 ml", amount: 300, icon: "water" },
  { id: "w500", label: "500 ml", amount: 500, icon: "water-outline" },
];
