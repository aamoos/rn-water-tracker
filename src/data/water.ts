import { MaterialCommunityIcons } from "@expo/vector-icons";

type WaterPreset = {
  id: string;
  label: string;
  amount: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap; // ✅ 타입 제한
};

export const WATER_PRESETS: WaterPreset[] = [
  { id: "cup200", label: "컵(200ml)", amount: 200, icon: "cup" },
  { id: "bottle500", label: "생수병(500ml)", amount: 500, icon: "bottle-soda" },
  { id: "mug300", label: "머그컵(300ml)", amount: 300, icon: "cup-outline" },
];
