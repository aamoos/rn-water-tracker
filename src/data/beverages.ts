import type { Beverage } from "../types";

export const BEVERAGES: Beverage[] = [
  { id: "water",  name: "물",   defaultAmount: 200, icon: "cup-water" },
  { id: "coffee", name: "커피", defaultAmount: 150, icon: "coffee-outline" },
  { id: "soda",   name: "탄산", defaultAmount: 250, icon: "bottle-soda-outline" },
];