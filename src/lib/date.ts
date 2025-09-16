// YYYY-MM-DD (로컬 기준)
export function ymd(d: number | Date): string {
  const dt = typeof d === "number" ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}