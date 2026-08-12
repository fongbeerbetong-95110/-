import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Role } from "@/features/meter-readings/types";

export type AdminRequest = {
  id: string;
  employeeId: string;
  fullName: string;
  position: string;
  phone: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  role?: Role;
};
export type AdminUser = {
  name: string;
  position: string;
  role: string;
  status: string;
};

export async function loadAdminData() {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const [requestResult, userResult] = await Promise.all([
    client.rpc("get_admin_access_requests"),
    client.rpc("get_admin_users"),
  ]);
  if (requestResult.error) throw new Error(requestResult.error.message);
  if (userResult.error) throw new Error(userResult.error.message);
  return {
    requests: (requestResult.data ?? []).map((r: any) => ({
      id: r.id,
      employeeId: r.employee_id,
      fullName: r.full_name,
      position: r.position,
      phone: r.phone,
      email: r.email,
      status: r.status,
    })),
    users: (userResult.data ?? []).map((u: any) => ({
      name: u.full_name,
      position: u.position,
      role: u.role_code,
      status: u.account_status,
    })),
  } as { requests: AdminRequest[]; users: AdminUser[] };
}

export async function reviewAccessRequest(
  requestId: string,
  stationId: string,
  role: Role,
  approve: boolean,
  reason?: string,
) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const roleCode = role.toLowerCase();
  const { error } = await client.rpc("review_access_request", {
    p_request_id: requestId,
    p_station_id: stationId,
    p_role_code: roleCode,
    p_approve: approve,
    p_reason: reason ?? null,
  });
  if (error) throw new Error(error.message);
}
