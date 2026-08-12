import type { MeterField, MeterKind, Reading } from "./types";

const labels: Record<MeterKind, Array<{ key: string; label: string }>> = {
  raw: [
    { key: "raw1", label: "มาตรน้ำดิบ 1" },
    { key: "raw2", label: "มาตรน้ำดิบ 2" },
  ],
  distribution: [
    { key: "high", label: "มาตรหลักโซนสูง" },
    { key: "low", label: "มาตรหลักโซนต่ำ" },
    { key: "waeng", label: "มาตรหลักแว้ง" },
  ],
};

export const rawTimes = ["00.00 น.", "06.00 น.", "14.00 น.", "22.00 น."];
export const hourlyTimes = Array.from(
  { length: 24 },
  (_, hour) => `${String(hour).padStart(2, "0")}.00 น.`,
);

export function getMeterFields(
  kind: MeterKind,
  readings: Reading[],
): MeterField[] {
  const latest = readings.find(
    (reading) => reading.kind === kind && reading.status !== "cancelled",
  );
  return labels[kind].map((field) => ({
    ...field,
    previous: latest?.values[field.key] ?? 0,
  }));
}
