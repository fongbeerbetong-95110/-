import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MeterConfiguration, MeterKind, Reading } from "./types";

type CreateReadingInput = {
  stationId: string;
  meterGroupId: string;
  date: string;
  time: string;
  values: Record<string, number>;
};

const fieldKey: Record<string, string> = {
  RAW_1: "raw1",
  RAW_2: "raw2",
  HIGH: "high",
  LOW: "low",
  WAENG: "waeng",
};

export async function loadMeterConfiguration(
  stationCode: string,
): Promise<MeterConfiguration> {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const { data: station, error: stationError } = await client
    .from("stations")
    .select("id,code,name_th")
    .eq("code", stationCode)
    .single();
  if (stationError || !station) throw new Error("ไม่พบสถานีที่ได้รับสิทธิ์");
  const { data: groups, error: groupError } = await client
    .from("meter_groups")
    .select("id,reading_type")
    .eq("station_id", station.id)
    .eq("is_active", true);
  if (groupError)
    throw new Error(`โหลดกลุ่มมาตรไม่สำเร็จ: ${groupError.message}`);
  const groupIds = {} as Record<MeterKind, string>;
  for (const group of groups ?? []) {
    groupIds[group.reading_type === "raw_water" ? "raw" : "distribution"] =
      group.id;
  }
  if (!groupIds.raw || !groupIds.distribution)
    throw new Error("ตั้งค่ากลุ่มมาตรของสถานียังไม่ครบ");
  return {
    stationId: station.id,
    stationCode: station.code,
    stationName: station.name_th,
    groupIds,
  };
}

export async function loadReadings(stationId: string): Promise<Reading[]> {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const { data, error } = await client
    .from("reading_session_details")
    .select("*")
    .eq("station_id", stationId)
    .order("observed_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(`โหลดข้อมูลมาตรไม่สำเร็จ: ${error.message}`);
  const grouped = new Map<string, Reading>();
  for (const row of data ?? []) {
    const id = String(row.session_id);
    const current: Reading = grouped.get(id) ?? {
      id,
      kind: row.reading_type === "raw_water" ? "raw" : "distribution",
      date: String(row.reading_date),
      time: `${String(row.reading_time).slice(0, 5).replace(":", ".")} น.`,
      values: {} as Record<string, number>,
      differences: {} as Record<string, number | null>,
      by: String(row.recorded_by_name ?? "ไม่ระบุ"),
      createdAt: String(row.recorded_at),
      status: row.status,
    };
    const key =
      fieldKey[String(row.meter_code)] ?? String(row.meter_code).toLowerCase();
    current.values[key] = Number(row.reading_value);
    current.differences![key] =
      row.difference_value == null ? null : Number(row.difference_value);
    grouped.set(id, current);
  }
  return [...grouped.values()];
}

export async function createReading(input: CreateReadingInput) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const readingTime = input.time.replace(".", ":").replace(" น.", "");
  const { data, error } = await client.rpc("create_reading_session", {
    p_station_id: input.stationId,
    p_meter_group_id: input.meterGroupId,
    p_reading_date: input.date,
    p_reading_time: readingTime,
    p_values: input.values,
  });
  if (error) {
    if (error.message.includes("reading_sessions_unique_active_slot"))
      throw new Error("วันที่และช่วงเวลานี้มีข้อมูลอยู่แล้ว");
    throw new Error(error.message);
  }
  return String(data);
}

export async function changeReading(
  sessionId: string,
  action: "edit" | "cancel" | "restore",
  reason: string,
  values?: Record<string, number>,
) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const { error } = await client.rpc("change_reading_session", {
    p_session_id: sessionId,
    p_action: action,
    p_values: values ?? null,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
}
