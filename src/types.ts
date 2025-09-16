export type Profile = {
  heightCm: number;
  weightKg: number;
  dailyTargetMl: number;
};

export type IntakeLog = {
  id: string;
  beverage: string;   // "물", "커피", "탄산"
  amount: number;     // ml
  createdAt: number;  // timestamp
};

export type Beverage = {
  id: string;
  name: string;          // "물" | "커피" | "탄산"
  defaultAmount: number; // 카드 탭 시 추가될 ml
  icon: string;          // MaterialCommunityIcons 이름
};

export type Reminder = {
  id: string;       // 내부 식별자(UUID)
  hour: number;
  minute: number;
  notifId: string;  // expo가 돌려준 예약 ID
};