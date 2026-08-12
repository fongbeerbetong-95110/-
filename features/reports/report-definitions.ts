import type { Reading } from "@/features/meter-readings/types";

export type ReportKey = "raw-water" | "produced-water" | "production-loss";
export type ReportPeriod = "shift" | "hour" | "day" | "month" | "fiscal-year";
export type ReportDefinition = {
  key: ReportKey;
  title: string;
  description: string;
  periods: { key: ReportPeriod; label: string }[];
  unit: string;
};

export const reportDefinitions: ReportDefinition[] = [
  {
    key: "raw-water",
    title: "ปริมาณน้ำดิบ",
    description: "สรุปผลต่างรวมจากมาตรน้ำดิบ 1 และมาตรน้ำดิบ 2",
    periods: [
      { key: "shift", label: "รายกะ" },
      { key: "day", label: "รายวัน" },
      { key: "month", label: "รายเดือน" },
      { key: "fiscal-year", label: "รายปีงบประมาณ" },
    ],
    unit: "ลบ.ม.",
  },
  {
    key: "produced-water",
    title: "ปริมาณน้ำผลิตจ่าย",
    description: "สรุปผลต่างรวมจากมาตรหลักโซนสูง โซนต่ำ และแว้ง",
    periods: [
      { key: "hour", label: "รายชั่วโมง" },
      { key: "day", label: "รายวัน" },
      { key: "month", label: "รายเดือน" },
      { key: "fiscal-year", label: "รายปีงบประมาณ" },
    ],
    unit: "ลบ.ม.",
  },
  {
    key: "production-loss",
    title: "ปริมาณน้ำสูญเสียในระบบผลิต",
    description: "คำนวณจากข้อมูลน้ำดิบและน้ำผลิตจ่าย โดยมีเป้าหมายไม่เกิน 5%",
    periods: [
      { key: "day", label: "รายวัน" },
      { key: "month", label: "รายเดือน" },
      { key: "fiscal-year", label: "รายปีงบประมาณ" },
    ],
    unit: "%",
  },
];

export type ReportDataPoint = { label: string; raw: number; produced: number };

function fiscalYear(date: string) {
  const value = new Date(`${date}T00:00:00`);
  return value.getFullYear() + (value.getMonth() >= 9 ? 1 : 0);
}

function groupKey(reading: Reading, period: ReportPeriod) {
  const hour = Number(reading.time.slice(0, 2));
  if (period === "hour")
    return `${reading.date} ${String(hour).padStart(2, "0")}.00 น.`;
  if (period === "day") return reading.date;
  if (period === "month") return reading.date.slice(0, 7);
  if (period === "fiscal-year")
    return `ปีงบประมาณ ${fiscalYear(reading.date) + 543}`;
  const shift = hour >= 6 && hour < 14 ? 1 : hour >= 14 && hour < 22 ? 2 : 3;
  return `${reading.date} · กะที่ ${shift}`;
}

export function getReportSeries(
  readings: Reading[],
  period: ReportPeriod,
): ReportDataPoint[] {
  const groups = new Map<string, ReportDataPoint>();
  for (const reading of readings) {
    if (reading.status !== "active") continue;
    const amount = Object.values(reading.differences ?? {}).reduce<number>(
      (sum, value) => sum + (value ?? 0),
      0,
    );
    const key = groupKey(reading, period);
    const row = groups.get(key) ?? { label: key, raw: 0, produced: 0 };
    if (reading.kind === "raw") row.raw += amount;
    else row.produced += amount;
    groups.set(key, row);
  }
  return [...groups.values()].sort((a, b) =>
    a.label.localeCompare(b.label, "th"),
  );
}

export const productionLossPercent = (raw: number, produced: number) =>
  raw <= 0 ? 0 : ((raw - produced) / raw) * 100;
