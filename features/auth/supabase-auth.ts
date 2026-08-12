import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type NewAccessRequest = {
  employeeId: string;
  fullName: string;
  position: string;
  phone: string;
  email: string;
};

export async function signIn(email: string, password: string) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  if (!email.includes("@")) throw new Error("กรุณาใช้อีเมลเข้าสู่ระบบ");
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error)
    throw new Error(
      error.message === "Invalid login credentials"
        ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        : error.message,
    );
  return { connected: true };
}

export async function signOut() {
  const client = getSupabaseBrowserClient();
  if (client) await client.auth.signOut();
}

export async function getCurrentUserAccess() {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data, error } = await client.rpc("get_current_user_access");
  if (error)
    throw new Error(
      "ไม่สามารถโหลดสิทธิ์ผู้ใช้งานได้ กรุณาติดตั้ง migration 202608120003",
    );
  const access = Array.isArray(data) ? data[0] : null;
  const roleCode = access?.role_code as string | undefined;
  const roleMap: Record<
    string,
    "Admin" | "Manager" | "Supervisor" | "Operator" | "Viewer"
  > = {
    admin: "Admin",
    manager: "Manager",
    supervisor: "Supervisor",
    operator: "Operator",
    viewer: "Viewer",
  };
  if (!roleCode || !roleMap[roleCode])
    throw new Error("บัญชียังไม่ได้รับการกำหนด Role และสถานี");
  return {
    userId: user.id,
    fullName: String(access.full_name),
    role: roleMap[roleCode],
    stationCode: String(access.station_code),
    stationName: String(access.station_name_th),
    mustChangePassword: Boolean(access.must_change_password),
  };
}

export async function submitAccessRequest(input: NewAccessRequest) {
  const client = getSupabaseBrowserClient();
  const requestNo = `REQ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  if (!client) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const { data, error } = await client.rpc("submit_access_request", {
    p_employee_id: input.employeeId,
    p_full_name: input.fullName,
    p_position: input.position,
    p_phone: input.phone,
    p_email: input.email,
    p_request_no: requestNo,
  });
  if (error)
    throw new Error(
      error.message.includes("duplicate")
        ? "รหัสพนักงานหรืออีเมลนี้มีคำขออยู่แล้ว"
        : error.message,
    );
  return { id: String(data), requestNo, connected: true };
}

export { isSupabaseConfigured };
