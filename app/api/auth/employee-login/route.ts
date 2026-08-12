import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const invalidCredentials = () =>
  NextResponse.json(
    { error: "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง" },
    { status: 401 },
  );

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      employeeId?: unknown;
      password?: unknown;
    };
    const employeeId = String(body.employeeId ?? "").trim();
    const password = String(body.password ?? "");
    if (!/^\d{3,20}$/.test(employeeId) || password.length < 6)
      return invalidCredentials();

    const admin = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("email,account_status")
      .eq("employee_id", employeeId)
      .maybeSingle();
    if (profileError || !profile || profile.account_status !== "active")
      return invalidCredentials();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !anonKey)
      return NextResponse.json(
        { error: "ระบบยังไม่ได้ตั้งค่า Supabase" },
        { status: 503 },
      );
    const authClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const { data, error } = await authClient.auth.signInWithPassword({
      email: String(profile.email),
      password,
    });
    if (error || !data.session) return invalidCredentials();

    return NextResponse.json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}
