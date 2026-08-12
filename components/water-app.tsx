"use client";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  ClipboardPenLine,
  ChartNoAxesCombined,
  Users,
  Settings,
  Menu,
  ChevronDown,
  ChevronRight,
  Droplets,
  LogOut,
  Clock3,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  Save,
  ShieldCheck,
  CalendarDays,
  ArrowRight,
  Factory,
  TriangleAlert,
  Pencil,
  Trash2,
  RotateCcw,
  History,
  LogIn,
  UserPlus,
  Mail,
  Phone,
  IdCard,
  Eye,
  EyeOff,
} from "./icons";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import {
  difference,
  formatNumber,
} from "@/features/meter-readings/calculations";
import {
  distributionFields,
  hourlyTimes,
  initialReadings,
  rawFields,
  rawTimes,
  systemUsers,
} from "@/features/meter-readings/mock-data";
import type {
  MeterField,
  MeterKind,
  Reading,
  Role,
} from "@/features/meter-readings/types";
import {
  getReportSeries,
  productionLossPercent,
  reportDefinitions,
  type ReportKey,
  type ReportPeriod,
} from "@/features/reports/report-definitions";
import {
  getCurrentUserAccess,
  signIn,
  signOut,
  isSupabaseConfigured,
} from "@/features/auth/supabase-auth";

type Page =
  | "dashboard"
  | "records"
  | "raw"
  | "distribution"
  | "reports"
  | "users"
  | "settings";
type AccessRequest = {
  id: string;
  employeeId: string;
  fullName: string;
  position: string;
  phone: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  role?: Role;
};
const roles: Role[] = ["Admin", "Manager", "Supervisor", "Operator", "Viewer"];
const roleThai: Record<Role, string> = {
  Admin: "ผู้ดูแลระบบ",
  Manager: "ผู้บริหาร",
  Supervisor: "หัวหน้าชุด",
  Operator: "ผู้ปฏิบัติงาน",
  Viewer: "ผู้ตรวจสอบ",
};
const chartData = [
  { t: "00:00", v: 312 },
  { t: "04:00", v: 284 },
  { t: "08:00", v: 438 },
  { t: "12:00", v: 476 },
  { t: "16:00", v: 451 },
  { t: "20:00", v: 390 },
  { t: "24:00", v: 326 },
];

export function WaterApp() {
  const [authenticated, setAuthenticated] = useState(false),
    [authReady, setAuthReady] = useState(false),
    [page, setPage] = useState<Page>("dashboard"),
    [open, setOpen] = useState(true),
    [mobile, setMobile] = useState(false),
    [loggingOut, setLoggingOut] = useState(false),
    [role, setRole] = useState<Role>("Operator"),
    [readings, setReadings] = useState(initialReadings),
    [requests, setRequests] = useState<AccessRequest[]>([
      {
        id: "REQ-001",
        employeeId: "54017",
        fullName: "นายกิตติพงศ์ ใจดี",
        position: "พนักงานผลิตน้ำ",
        phone: "0891234567",
        email: "kittipong@example.go.th",
        status: "pending",
      },
    ]);
  const canWrite = ["Admin", "Supervisor", "Operator"].includes(role);
  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      setAuthenticated(false);
      setPage("dashboard");
      setMobile(false);
    } finally {
      setLoggingOut(false);
    }
  }
  useEffect(() => {
    let active = true;
    (async () => {
      if (!isSupabaseConfigured) {
        if (active) setAuthReady(true);
        return;
      }
      try {
        const access = await getCurrentUserAccess();
        if (active && access) {
          setRole(access.role);
          setAuthenticated(true);
        }
      } catch {
      } finally {
        if (active) setAuthReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  if (!authReady)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f9fc] text-sm font-bold text-[#063b66]">
        กำลังตรวจสอบบัญชีผู้ใช้งาน…
      </div>
    );
  if (!authenticated)
    return (
      <AuthFlow
        onLogin={async (identity, password) => {
          const result = await signIn(identity, password);
          if (result.demo) {
            setAuthenticated(true);
            return;
          }
          const access = await getCurrentUserAccess();
          if (!access) throw new Error("ไม่พบข้อมูลสิทธิ์ผู้ใช้งาน");
          setRole(access.role);
          setAuthenticated(true);
        }}
        onRequest={(request) => setRequests((items) => [request, ...items])}
      />
    );
  return (
    <div className="min-h-screen lg:flex">
      {mobile && (
        <button
          aria-label="ปิดเมนู"
          className="fixed inset-0 z-30 bg-[#062e4d]/45 lg:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[276px] bg-[#063b66] text-white transition-transform lg:sticky lg:translate-x-0 ${mobile ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-white/15 px-5">
          <div className="grid size-10 place-items-center rounded-xl bg-white text-[#087ac1]">
            <Droplets size={23} />
          </div>
          <div>
            <div className="text-sm font-bold">ระบบข้อมูลการผลิตน้ำ</div>
            <div className="mt-0.5 text-xs text-sky-200">
              กปภ.สาขาสุไหงโก-ลก
            </div>
          </div>
        </div>
        <nav aria-label="เมนูหลัก" className="p-3 text-sm">
          <Nav
            active={page === "dashboard"}
            icon={<LayoutDashboard />}
            text="ภาพรวม"
            onClick={() => go("dashboard")}
          />
          <button
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left font-bold hover:bg-white/10"
            onClick={() => setOpen(!open)}
          >
            <Droplets size={19} />
            <span className="flex-1">แม่ข่ายสุไหงโก-ลก</span>
            {open ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
          </button>
          {open && (
            <div className="ml-[21px] border-l border-sky-300/35 pl-3">
              {canWrite && (
                <Nav
                  active={
                    page === "records" ||
                    page === "raw" ||
                    page === "distribution"
                  }
                  icon={<ClipboardPenLine />}
                  text="บันทึกข้อมูล"
                  onClick={() => go("records")}
                />
              )}
              <Nav
                active={page === "reports"}
                icon={<ChartNoAxesCombined />}
                text="Dashboard / รายงาน"
                onClick={() => go("reports")}
              />
            </div>
          )}
          {role === "Admin" && (
            <div className="mt-5 border-t border-white/15 pt-4">
              <Nav
                active={page === "users"}
                icon={<Users />}
                text="จัดการผู้ใช้"
                onClick={() => go("users")}
              />
              <Nav
                active={page === "settings"}
                icon={<Settings />}
                text="ตั้งค่าระบบ"
                onClick={() => go("settings")}
              />
            </div>
          )}
        </nav>
        <div className="absolute inset-x-3 bottom-3 border-t border-white/15 pt-3">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
          >
            <LogOut size={18} />
            ออกจากระบบ
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex h-[76px] items-center border-b border-[#cfe3ef] bg-white px-4 md:px-7">
          <button
            className="mr-3 rounded-lg p-2 text-[#063b66] lg:hidden"
            onClick={() => setMobile(true)}
            aria-label="เปิดเมนู"
          >
            <Menu />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-[#063b66]">
              แม่ข่ายสุไหงโก-ลก
            </div>
            <div className="truncate text-xs text-[#5b7180]">
              สถานะระบบ: พร้อมใช้งาน · ข้อมูลตัวอย่าง
            </div>
          </div>
          <label
            className={`${isSupabaseConfigured ? "hidden" : "hidden sm:flex"} items-center gap-2 text-xs text-[#5b7180]`}
          >
            มุมมอง Role
            <select
              value={role}
              onChange={(e) => {
                const next = e.target.value as Role;
                setRole(next);
                if (
                  !["Admin", "Supervisor", "Operator"].includes(next) &&
                  (page === "raw" || page === "distribution")
                )
                  setPage("dashboard");
              }}
              className="rounded-lg border border-[#aacddd] bg-white px-3 py-2 text-sm font-bold text-[#063b66]"
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          {isSupabaseConfigured && (
            <div className="hidden rounded-full bg-[#e7f6ee] px-3 py-1.5 text-xs font-bold text-[#137a4b] sm:block">
              {roleThai[role]}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="ออกจากระบบ"
            className="ml-2 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#9bbdce] bg-white px-3 text-sm font-bold text-[#063b66] hover:bg-[#f4f9fc] disabled:cursor-wait disabled:opacity-60"
          >
            <LogOut size={17} aria-hidden="true" />
            <span className="hidden md:inline">
              {loggingOut ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
            </span>
          </button>
          <div className="ml-3 grid size-9 place-items-center rounded-full bg-[#d9effb] text-sm font-bold text-[#063b66]">
            ส
          </div>
        </header>
        <div className="p-4 md:p-7">
          {page === "dashboard" && (
            <Dashboard
              onRecord={() => setPage("records")}
              canWrite={canWrite}
            />
          )}{" "}
          {page === "records" && <RecordMenu onSelect={setPage} />}{" "}
          {(page === "raw" || page === "distribution") && (
            <ReadingForm
              kind={page}
              readings={readings}
              onCancel={() => setPage("records")}
              onSave={(r) => {
                const actor =
                  role === "Admin"
                    ? "นายอำนาจ ทัฬหกิจ"
                    : role === "Supervisor"
                      ? "นายวิศิษฎ์ บุญมาศ"
                      : "นายศราวุธ นิลโมจน์";
                setReadings((x) => [
                  {
                    ...r,
                    by: actor,
                    status: "active",
                    audit: [
                      {
                        id: crypto.randomUUID(),
                        action: "created",
                        by: actor,
                        at: "เมื่อสักครู่",
                      },
                    ],
                  },
                  ...x,
                ]);
                setPage("dashboard");
              }}
            />
          )}
          {page === "reports" && (
            <Reports
              readings={readings}
              setReadings={setReadings}
              role={role}
            />
          )}{" "}
          {page === "users" && (
            <UsersPage requests={requests} setRequests={setRequests} />
          )}{" "}
          {page === "settings" && <Placeholder page={page} />}
        </div>
      </main>
    </div>
  );
  function go(p: Page) {
    setPage(p);
    setMobile(false);
  }
}

function Nav({
  active,
  icon,
  text,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`my-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${active ? "bg-white text-[#063b66] font-bold" : "text-sky-50 hover:bg-white/10"}`}
    >
      <span className="[&>svg]:size-[18px]">{icon}</span>
      {text}
    </button>
  );
}

function AuthFlow({
  onLogin,
  onRequest,
}: {
  onLogin: (identity: string, password: string) => Promise<void>;
  onRequest: (request: AccessRequest) => void;
}) {
  const [view, setView] = useState<"login" | "request" | "pending">("login"),
    [submitted, setSubmitted] = useState(false),
    [authError, setAuthError] = useState(""),
    [authLoading, setAuthLoading] = useState(false),
    [showPassword, setShowPassword] = useState(false),
    [login, setLogin] = useState({ identity: "", password: "" }),
    [form, setForm] = useState({
      employeeId: "",
      fullName: "",
      position: "",
      phone: "",
      email: "",
      consent: false,
    });
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    phoneOk = /^0\d{8,9}$/.test(form.phone),
    requestValid =
      form.employeeId.trim().length >= 3 &&
      form.fullName.trim().length >= 5 &&
      form.position.trim().length >= 2 &&
      phoneOk &&
      emailOk &&
      form.consent;
  // eslint-disable-next-line react-hooks/purity -- mock-only request number; backend will supply the persistent identifier
  if (view === "pending")
    return (
      <AuthShell>
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#eaf6fd] text-[#087ac1]">
            <Clock3 size={30} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-[#063b66]">
            ส่งคำขอเรียบร้อยแล้ว
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#5b7180]">
            คำขอของคุณอยู่ระหว่างการตรวจสอบโดยผู้ดูแลระบบ เมื่อได้รับอนุมัติ
            ระบบจะแจ้งขั้นตอนตั้งรหัสผ่านผ่านอีเมลที่ระบุ
          </p>
          <div className="mt-6 bg-[#f4f9fc] p-4 text-left text-sm">
            <div className="text-xs text-[#5b7180]">เลขที่คำขอ</div>
            <div className="tabular mt-1 font-bold text-[#063b66]">
              REQ-{Date.now().toString().slice(-6)}
            </div>
            <div className="mt-3 text-xs text-[#5b7180]">สถานะ</div>
            <div className="mt-1 inline-flex items-center gap-1 font-bold text-[#7a5200]">
              <Clock3 size={15} />
              รอตรวจสอบ
            </div>
          </div>
          <button
            onClick={() => setView("login")}
            className="mt-6 rounded-lg border border-[#87afc4] px-5 py-2.5 text-sm font-bold text-[#063b66]"
          >
            กลับหน้าเข้าสู่ระบบ
          </button>
        </div>
      </AuthShell>
    );
  return (
    <AuthShell>
      {view === "login" ? (
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold text-[#063b66]">เข้าสู่ระบบ</h1>
          <p className="mt-1 text-sm text-[#5b7180]">
            ใช้บัญชีที่ได้รับการอนุมัติจากผู้ดูแลระบบ
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmitted(true);
              setAuthError("");
              if (!login.identity || !login.password) return;
              setAuthLoading(true);
              try {
                await onLogin(login.identity, login.password);
              } catch (error) {
                setAuthError(
                  error instanceof Error
                    ? error.message
                    : "Login failed",
                );
              } finally {
                setAuthLoading(false);
              }
            }}
            className="mt-6 space-y-4"
          >
            <AuthField label="รหัสพนักงานหรืออีเมล" icon={<IdCard />}>
              <input
                autoComplete="username"
                value={login.identity}
                onChange={(e) =>
                  setLogin((x) => ({ ...x, identity: e.target.value }))
                }
                className="w-full rounded-lg border border-[#9bbdce] py-3 pl-11 pr-3"
                placeholder="กรอกรหัสพนักงานหรืออีเมล"
              />
            </AuthField>
            <AuthField label="รหัสผ่าน" icon={<ShieldCheck />}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={login.password}
                onChange={(e) =>
                  setLogin((x) => ({ ...x, password: e.target.value }))
                }
                className="w-full rounded-lg border border-[#9bbdce] py-3 pl-11 pr-12 text-base"
                placeholder="กรอกรหัสผ่าน"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                aria-pressed={showPassword}
                className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-[#5b7180] hover:bg-[#eaf6fd] hover:text-[#063b66]"
              >
                {showPassword ? (
                  <EyeOff size={19} aria-hidden="true" />
                ) : (
                  <Eye size={19} aria-hidden="true" />
                )}
              </button>
            </AuthField>
            {submitted && (!login.identity || !login.password) && (
              <ErrorText text="กรุณากรอกข้อมูลเข้าสู่ระบบให้ครบ" />
            )}
            {authError && <ErrorText text={authError} />}
            <button
              disabled={authLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#087ac1] px-4 py-3 font-bold text-white hover:bg-[#066aa9] disabled:cursor-wait disabled:opacity-60"
            >
              <LogIn size={18} />
              เข้าสู่ระบบ
            </button>
          </form>
          <div className="mt-6 border-t border-[#cfe3ef] pt-5 text-center">
            <p className="text-sm text-[#5b7180]">ยังไม่มีบัญชีสำหรับใช้งาน?</p>
            <button
              onClick={() => {
                setView("request");
                setSubmitted(false);
              }}
              className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#087ac1]"
            >
              <UserPlus size={17} />
              ขอเข้าใช้งานครั้งแรก
            </button>
          </div>
          <button
            onClick={() => onLogin("demo", "demo")}
            className={
              isSupabaseConfigured
                ? "hidden"
                : "mt-6 w-full text-center text-xs text-[#5b7180] underline underline-offset-4"
            }
          >
            เข้าสู่ระบบด้วยบัญชีตัวอย่างสำหรับทดสอบ UI
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          <button
            onClick={() => {
              setView("login");
              setSubmitted(false);
            }}
            className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-[#087ac1]"
          >
            <ArrowLeft size={17} />
            กลับหน้าเข้าสู่ระบบ
          </button>
          <h1 className="text-2xl font-bold text-[#063b66]">
            ขอเข้าใช้งานครั้งแรก
          </h1>
          <p className="mt-1 text-sm text-[#5b7180]">
            กรอกข้อมูลเพื่อส่งให้ผู้ดูแลระบบตรวจสอบและกำหนดสิทธิ์
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
              if (requestValid) {
                onRequest({
                  id: crypto.randomUUID(),
                  ...form,
                  status: "pending",
                });
                setView("pending");
              }
            }}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <AuthInput
              label="รหัสพนักงาน"
              value={form.employeeId}
              onChange={(value) =>
                setForm((x) => ({ ...x, employeeId: value.replace(/\D/g, "") }))
              }
              icon={<IdCard />}
              error={
                submitted && form.employeeId.length < 3
                  ? "กรุณากรอกรหัสพนักงาน"
                  : undefined
              }
            />
            <AuthInput
              label="ชื่อ–นามสกุล"
              value={form.fullName}
              onChange={(value) => setForm((x) => ({ ...x, fullName: value }))}
              icon={<Users />}
              error={
                submitted && form.fullName.trim().length < 5
                  ? "กรุณากรอกชื่อ–นามสกุล"
                  : undefined
              }
            />
            <AuthInput
              label="ตำแหน่ง"
              value={form.position}
              onChange={(value) => setForm((x) => ({ ...x, position: value }))}
              icon={<Factory />}
              error={
                submitted && form.position.trim().length < 2
                  ? "กรุณากรอกตำแหน่ง"
                  : undefined
              }
            />
            <AuthInput
              label="เบอร์โทรศัพท์"
              value={form.phone}
              onChange={(value) =>
                setForm((x) => ({
                  ...x,
                  phone: value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              icon={<Phone />}
              inputMode="tel"
              error={
                submitted && !phoneOk
                  ? "กรุณากรอกเบอร์โทรศัพท์ 9–10 หลัก"
                  : undefined
              }
            />
            <div className="md:col-span-2">
              <AuthInput
                label="อีเมล"
                value={form.email}
                onChange={(value) => setForm((x) => ({ ...x, email: value }))}
                icon={<Mail />}
                inputMode="email"
                error={
                  submitted && !emailOk ? "กรุณากรอกอีเมลให้ถูกต้อง" : undefined
                }
              />
            </div>
            <label className="flex items-start gap-3 bg-[#f4f9fc] p-4 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) =>
                  setForm((x) => ({ ...x, consent: e.target.checked }))
                }
                className="mt-1 size-4 accent-[#087ac1]"
              />
              <span>
                ข้าพเจ้ายืนยันว่าข้อมูลถูกต้องและยอมรับการนำข้อมูลไปใช้เพื่อพิจารณาสิทธิ์เข้าใช้งานระบบ
              </span>
            </label>
            {submitted && !form.consent && (
              <div className="md:col-span-2">
                <ErrorText text="กรุณายอมรับเงื่อนไขก่อนส่งคำขอ" />
              </div>
            )}
            <div className="md:col-span-2">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#087ac1] px-4 py-3 font-bold text-white">
                <Save size={18} />
                ส่งคำขอเข้าใช้งาน
              </button>
            </div>
          </form>
        </div>
      )}
    </AuthShell>
  );
}
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f4f9fc] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden bg-[#063b66] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl bg-white text-[#087ac1]">
            <Droplets size={27} />
          </div>
          <div>
            <div className="font-bold">ระบบบริหารจัดการข้อมูลการผลิตน้ำ</div>
            <div className="mt-1 text-sm text-sky-200">กปภ.สาขาสุไหงโก-ลก</div>
          </div>
        </div>
        <div>
          <h2 className="max-w-lg text-3xl font-bold leading-snug">
            ข้อมูลการผลิตที่ถูกต้อง เริ่มจากผู้ใช้งานที่ได้รับการยืนยัน
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-sky-100">
            ระบบควบคุมสิทธิ์ตามหน้าที่
            ผู้ใช้งานครั้งแรกต้องส่งคำขอและรอผู้ดูแลระบบตรวจสอบก่อนเข้าถึงข้อมูลการผลิตน้ำ
          </p>
        </div>
        <div className="text-xs text-sky-200">
          UI MVP · ยังไม่เชื่อมต่อ Supabase Authentication
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center p-5 md:p-10">
        <div className="w-full max-w-3xl bg-white p-6 ring-1 ring-[#cfe3ef] md:p-9">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-[#eaf6fd] text-[#087ac1]">
              <Droplets size={22} />
            </div>
            <div>
              <div className="text-sm font-bold text-[#063b66]">
                ระบบข้อมูลการผลิตน้ำ
              </div>
              <div className="text-xs text-[#5b7180]">กปภ.สาขาสุไหงโก-ลก</div>
            </div>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
function AuthField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-bold text-[#263f4e]">
      {label}
      <div className="relative mt-2">
        <span className="absolute left-3 top-3 text-[#5b7180] [&>svg]:size-[19px]">
          {icon}
        </span>
        {children}
      </div>
    </label>
  );
}
function AuthInput({
  label,
  value,
  onChange,
  icon,
  inputMode,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
}) {
  return (
    <div>
      <AuthField label={label} icon={icon}>
        <input
          value={value}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border py-3 pl-11 pr-3 ${error ? "border-[#b42318] bg-[#fff8f7]" : "border-[#9bbdce]"}`}
        />
      </AuthField>
      {error && <ErrorText text={error} />}
    </div>
  );
}

function Dashboard({
  onRecord,
  canWrite,
}: {
  onRecord: () => void;
  canWrite: boolean;
}) {
  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#063b66] md:text-[28px]">
            ภาพรวมการผลิตน้ำ
          </h1>
          <p className="mt-1 text-sm text-[#5b7180]">
            วันพุธที่ 12 สิงหาคม 2569 · ข้อมูลตัวอย่าง
          </p>
        </div>
        {canWrite && (
          <button
            onClick={onRecord}
            className="rounded-lg bg-[#087ac1] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#066aa9]"
          >
            <span className="inline-flex items-center gap-2">
              <ClipboardPenLine size={18} />
              บันทึกข้อมูลรอบใหม่
            </span>
          </button>
        )}
      </div>
      <section className="mb-6 border-y border-[#cfe3ef] bg-white">
        <div className="grid md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="p-5 md:p-6">
            <div className="flex items-center gap-2 font-bold text-[#063b66]">
              <Clock3 size={20} />
              สถานะรอบบันทึกวันนี้
            </div>
            <div className="mt-5 flex gap-2">
              {["00", "06", "14", "22"].map((x, i) => (
                <div key={x} className="flex-1 text-center">
                  <div
                    className={`mx-auto grid size-9 place-items-center rounded-full text-sm font-bold ${i < 2 ? "bg-[#147a4a] text-white" : "border-2 border-[#9bc5dc] bg-white text-[#5b7180]"}`}
                  >
                    {i < 2 ? "✓" : x}
                  </div>
                  <div className="mt-2 text-xs text-[#5b7180]">{x}.00 น.</div>
                </div>
              ))}
            </div>
          </div>
          <Metric
            label="น้ำดิบรวมล่าสุด"
            value="386"
            unit="ลบ.ม."
            note="รอบ 06.00 น."
          />
          <Metric
            label="จ่ายน้ำรวมล่าสุด"
            value="321"
            unit="ลบ.ม."
            note="รอบ 05.00 น."
          />
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <section className="min-w-0 bg-white p-5 ring-1 ring-[#cfe3ef] md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#063b66]">
                แนวโน้มการจ่ายน้ำวันนี้
              </h2>
              <p className="text-xs text-[#5b7180]">
                ปริมาณผลต่างรวมรายช่วงเวลา (ลบ.ม.)
              </p>
            </div>
            <span className="rounded-full bg-[#eaf6fd] px-3 py-1 text-xs font-bold text-[#087ac1]">
              ข้อมูลตัวอย่าง
            </span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#dfedf4" vertical={false} />
                <XAxis
                  dataKey="t"
                  tick={{ fill: "#5b7180", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#5b7180", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#087ac1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="bg-white p-5 ring-1 ring-[#cfe3ef] md:p-6">
          <h2 className="text-lg font-bold text-[#063b66]">รายการล่าสุด</h2>
          <div className="mt-3 divide-y divide-[#dcebf3]">
            {initialReadings.map((r) => (
              <div key={r.id} className="py-4">
                <div className="flex justify-between gap-3">
                  <span className="text-sm font-bold">
                    {r.kind === "raw" ? "มาตรน้ำดิบ" : "มาตรหลักทางจ่าย"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#147a4a]">
                    <CheckCircle2 size={14} />
                    สมบูรณ์
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#5b7180]">
                  {r.time} · {r.by}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
function Metric({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
}) {
  return (
    <div className="border-t border-[#cfe3ef] p-5 md:border-l md:border-t-0 md:p-6">
      <div className="text-sm text-[#5b7180]">{label}</div>
      <div className="tabular mt-3 text-3xl font-bold text-[#063b66]">
        {value}{" "}
        <span className="text-sm font-normal text-[#5b7180]">{unit}</span>
      </div>
      <div className="mt-2 text-xs text-[#5b7180]">{note}</div>
    </div>
  );
}

function RecordMenu({ onSelect }: { onSelect: (page: Page) => void }) {
  return (
    <div className="mx-auto max-w-[980px]">
      <h1 className="text-2xl font-bold text-[#063b66]">บันทึกข้อมูล</h1>
      <p className="mt-1 text-sm text-[#5b7180]">
        เลือกแบบฟอร์มที่ต้องการบันทึกสำหรับแม่ข่ายสุไหงโก-ลก
      </p>
      <div className="mt-6 overflow-hidden bg-white ring-1 ring-[#cfe3ef]">
        <button
          onClick={() => onSelect("raw")}
          className="group flex w-full items-center gap-4 border-b border-[#cfe3ef] p-5 text-left hover:bg-[#f4f9fc] md:p-6"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eaf6fd] text-[#087ac1]">
            <Droplets size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-[#063b66]">
              แบบฟอร์มบันทึกมาตรน้ำดิบ
            </span>
            <span className="mt-1 block text-sm text-[#5b7180]">
              บันทึกมาตรน้ำดิบ 1 และมาตรน้ำดิบ 2 ตามรอบ 00.00, 06.00, 14.00 และ
              22.00 น.
            </span>
          </span>
          <ArrowRight className="shrink-0 text-[#087ac1]" size={20} />
        </button>
        <button
          onClick={() => onSelect("distribution")}
          className="group flex w-full items-center gap-4 p-5 text-left hover:bg-[#f4f9fc] md:p-6"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eaf6fd] text-[#087ac1]">
            <ChartNoAxesCombined size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-[#063b66]">
              แบบฟอร์มบันทึกมาตรหลักทางจ่าย
            </span>
            <span className="mt-1 block text-sm text-[#5b7180]">
              บันทึกมาตรหลักโซนสูง โซนต่ำ และแว้ง ครบทั้ง 24 ชั่วโมง
            </span>
          </span>
          <ArrowRight className="shrink-0 text-[#087ac1]" size={20} />
        </button>
      </div>
    </div>
  );
}

function ReadingForm({
  kind,
  readings,
  onSave,
  onCancel,
}: {
  kind: MeterKind;
  readings: Reading[];
  onSave: (r: Reading) => void;
  onCancel: () => void;
}) {
  const isRaw = kind === "raw",
    fields = isRaw ? rawFields : distributionFields,
    times = isRaw ? rawTimes : hourlyTimes;
  const [date, setDate] = useState("2026-08-12"),
    [time, setTime] = useState(isRaw ? "14.00 น." : "06.00 น."),
    [values, setValues] = useState<Record<string, string>>({}),
    [confirm, setConfirm] = useState(false),
    [submitted, setSubmitted] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const duplicate = readings.some(
    (r) => r.kind === kind && r.date === date && r.time === time,
  );
  const errors = fields.filter(
    (f) =>
      values[f.key] === "" ||
      values[f.key] === undefined ||
      !/^\d+$/.test(values[f.key]) ||
      Number(values[f.key]) < f.previous,
  );
  const valid = date && time && !duplicate && errors.length === 0;
  useEffect(() => {
    if (!confirm) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirm(false);
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [confirm]);
  return (
    <div className="mx-auto max-w-[980px]">
      <div className="mb-6">
        <button
          onClick={onCancel}
          className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-[#087ac1]"
        >
          <ArrowLeft size={17} />
          กลับ
        </button>
        <h1 className="text-2xl font-bold text-[#063b66]">
          {isRaw ? "บันทึกมาตรน้ำดิบ" : "บันทึกมาตรหลักทางจ่าย"}
        </h1>
        <p className="mt-1 text-sm text-[#5b7180]">
          กรอกค่าที่อ่านได้จากมาตร
          ระบบจะคำนวณผลต่างจากรายการก่อนหน้าให้โดยอัตโนมัติ
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (valid) setConfirm(true);
        }}
        noValidate
        className="bg-white ring-1 ring-[#cfe3ef]"
      >
        <div className="border-b border-[#cfe3ef] bg-[#eaf6fd] px-5 py-4 font-bold text-[#063b66]">
          ข้อมูลรอบการบันทึก
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
          <FieldLabel label="วันที่">
            <div className="relative">
              <CalendarDays
                className="absolute left-3 top-3 text-[#5b7180]"
                size={18}
              />
              <input
                type="date"
                value={date}
                max="2026-08-12"
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-[#9bbdce] py-2.5 pl-10 pr-3"
              />
            </div>
          </FieldLabel>
          <FieldLabel label="ช่วงเวลา">
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2.5 ${duplicate ? "border-[#b42318]" : "border-[#9bbdce]"}`}
            >
              {times.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            {duplicate && (
              <ErrorText text="มีข้อมูลของวันที่และช่วงเวลานี้แล้ว กรุณาเลือกช่วงเวลาอื่น" />
            )}
          </FieldLabel>
        </div>
        <div className="border-y border-[#cfe3ef] bg-[#f8fbfd] px-5 py-4">
          <div className="font-bold text-[#063b66]">ค่ามาตร</div>
          <div className="mt-1 text-xs text-[#5b7180]">
            หน่วย: ลูกบาศก์เมตร (ลบ.ม.) · ทุกช่องจำเป็นต้องกรอก
          </div>
        </div>
        <div className="divide-y divide-[#dcebf3]">
          {fields.map((f) => (
            <MeterInput
              key={f.key}
              field={f}
              value={values[f.key] ?? ""}
              showError={submitted}
              onChange={(v) => setValues((x) => ({ ...x, [f.key]: v }))}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#cfe3ef] bg-[#f8fbfd] px-5 py-4">
          <div className="text-xs text-[#5b7180]">
            <ShieldCheck size={16} className="mr-1 inline" />
            ระบบจะให้ยืนยันข้อมูลอีกครั้งก่อนบันทึก
          </div>
          <button className="rounded-lg bg-[#087ac1] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#066aa9]">
            ตรวจสอบข้อมูล
          </button>
        </div>
      </form>
      {confirm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#062e4d]/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="confirm-in max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start border-b border-[#cfe3ef] p-5">
              <div className="grid size-10 place-items-center rounded-full bg-[#dff5e9] text-[#147a4a]">
                <CheckCircle2 />
              </div>
              <div className="ml-3 flex-1">
                <h2
                  id="confirm-title"
                  className="text-xl font-bold text-[#063b66]"
                >
                  ยืนยันข้อมูลก่อนบันทึก
                </h2>
                <p className="text-sm text-[#5b7180]">
                  โปรดตรวจสอบค่ามาตรและผลต่างให้ถูกต้อง
                </p>
              </div>
              <button
                aria-label="ปิด"
                onClick={() => setConfirm(false)}
                className="p-1"
              >
                <X />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-[#eaf6fd] p-5 text-sm">
              <div>
                <span className="text-[#5b7180]">วันที่</span>
                <div className="mt-1 font-bold">12 สิงหาคม 2569</div>
              </div>
              <div>
                <span className="text-[#5b7180]">ช่วงเวลา</span>
                <div className="mt-1 font-bold">{time}</div>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-[#cfe3ef] pb-2 text-xs font-bold text-[#5b7180]">
                <span>รายการ</span>
                <span>ค่าปัจจุบัน</span>
                <span>ผลต่าง</span>
              </div>
              {fields.map((f) => (
                <div
                  key={f.key}
                  className="tabular grid grid-cols-[1fr_auto_auto] gap-3 border-b border-[#dcebf3] py-3 text-sm"
                >
                  <span className="font-bold">{f.label}</span>
                  <span>{formatNumber(Number(values[f.key]))}</span>
                  <span className="min-w-20 text-right font-bold text-[#147a4a]">
                    +{formatNumber(Number(values[f.key]) - f.previous)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-[#cfe3ef] p-5 sm:flex-row sm:justify-end">
              <button
                onClick={() => setConfirm(false)}
                className="rounded-lg border border-[#87afc4] px-4 py-2.5 text-sm font-bold text-[#063b66]"
              >
                กลับไปแก้ไข
              </button>
              <button
                ref={confirmRef}
                onClick={() =>
                  onSave({
                    id: crypto.randomUUID(),
                    kind,
                    date,
                    time,
                    values: Object.fromEntries(
                      Object.entries(values).map(([k, v]) => [k, Number(v)]),
                    ),
                    by: "ผู้ใช้งานตัวอย่าง",
                    createdAt: "เมื่อสักครู่",
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#147a4a] px-4 py-2.5 text-sm font-bold text-white"
              >
                <Save size={17} />
                ยืนยันและบันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-bold text-[#263f4e]">
      {label}
      <span className="text-[#b42318]"> *</span>
      <div className="mt-2 font-normal">{children}</div>
    </label>
  );
}
function MeterInput({
  field,
  value,
  showError,
  onChange,
}: {
  field: MeterField;
  value: string;
  showError: boolean;
  onChange: (v: string) => void;
}) {
  const d = difference(value, field.previous),
    bad = d !== null && d < 0,
    empty = showError && !value;
  return (
    <div className="grid gap-4 p-5 md:grid-cols-[1.1fr_1fr_1fr] md:items-start md:p-6">
      <div>
        <div className="font-bold text-[#263f4e]">
          {field.label}
          <span className="text-[#b42318]"> *</span>
        </div>
        <div className="tabular mt-1 text-xs text-[#5b7180]">
          ค่าครั้งก่อน {formatNumber(field.previous)} ลบ.ม.
        </div>
      </div>
      <div>
        <input
          aria-label={field.label}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          placeholder="0"
          className={`tabular w-full rounded-lg border px-3 py-2.5 text-right ${bad || empty ? "border-[#b42318] bg-[#fff8f7]" : "border-[#9bbdce]"}`}
        />
        {empty && <ErrorText text="กรุณากรอกค่ามาตรเป็นจำนวนเต็ม" />}
        {bad && (
          <ErrorText
            text={`ค่าปัจจุบันน้อยกว่าค่าครั้งก่อน ${formatNumber(Math.abs(d!))} ลบ.ม.`}
          />
        )}
      </div>
      <div
        className={`tabular rounded-lg px-3 py-2.5 text-right text-sm font-bold ${d === null ? "bg-[#edf3f6] text-[#5b7180]" : bad ? "bg-[#fff0ee] text-[#b42318]" : "bg-[#e5f6ed] text-[#147a4a]"}`}
      >
        {d === null
          ? "รอคำนวณ"
          : `${d >= 0 ? "+" : ""}${formatNumber(d)} ลบ.ม.`}
        <div className="text-xs font-normal">ผลต่าง</div>
      </div>
    </div>
  );
}
function ErrorText({ text }: { text: string }) {
  return (
    <p className="mt-1.5 flex items-start gap-1 text-xs text-[#b42318]">
      <AlertCircle size={14} className="mt-px shrink-0" />
      {text}
    </p>
  );
}
function Reports({
  readings,
  setReadings,
  role,
}: {
  readings: Reading[];
  setReadings: React.Dispatch<React.SetStateAction<Reading[]>>;
  role: Role;
}) {
  const [report, setReport] = useState<ReportKey>("raw-water"),
    [period, setPeriod] = useState<ReportPeriod>("shift");
  const definition = reportDefinitions.find((item) => item.key === report)!,
    series = getReportSeries(report, period);
  const rows = series.map((item) => ({
    ...item,
    loss: productionLossPercent(item.raw, item.produced),
  }));
  const totalRaw = rows.reduce((sum, item) => sum + item.raw, 0),
    totalProduced = rows.reduce((sum, item) => sum + item.produced, 0),
    loss = productionLossPercent(totalRaw, totalProduced),
    withinTarget = loss <= 5;
  const selectReport = (key: ReportKey) => {
    setReport(key);
    setPeriod(
      reportDefinitions.find((item) => item.key === key)!.periods[0].key,
    );
  };
  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#063b66]">
            Dashboard / รายงาน
          </h1>
          <p className="mt-1 text-sm text-[#5b7180]">
            วิเคราะห์ข้อมูลการผลิตน้ำของแม่ข่ายสุไหงโก-ลก · ข้อมูลตัวอย่าง
          </p>
        </div>
        <label className="text-xs font-bold text-[#5b7180]">
          ช่วงข้อมูล
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            className="ml-2 rounded-lg border border-[#9bbdce] bg-white px-3 py-2.5 text-sm font-bold text-[#063b66]"
          >
            {definition.periods.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <nav
          aria-label="ประเภทรายงาน"
          className="self-start overflow-hidden bg-white ring-1 ring-[#cfe3ef]"
        >
          <div className="border-b border-[#cfe3ef] bg-[#eaf6fd] px-5 py-4 font-bold text-[#063b66]">
            ประเภทรายงาน
          </div>
          {reportDefinitions.map((item) => (
            <button
              key={item.key}
              onClick={() => selectReport(item.key)}
              className={`flex w-full items-start gap-3 border-b border-[#dcebf3] p-4 text-left last:border-b-0 ${report === item.key ? "bg-[#087ac1] text-white" : "hover:bg-[#f4f9fc]"}`}
            >
              <span
                className={`mt-0.5 ${report === item.key ? "text-white" : "text-[#087ac1]"}`}
              >
                {item.key === "raw-water" ? (
                  <Droplets size={19} />
                ) : item.key === "produced-water" ? (
                  <Factory size={19} />
                ) : (
                  <TriangleAlert size={19} />
                )}
              </span>
              <span>
                <span className="block text-sm font-bold">{item.title}</span>
                <span
                  className={`mt-1 block text-xs ${report === item.key ? "text-sky-100" : "text-[#5b7180]"}`}
                >
                  {item.periods.map((x) => x.label).join(" · ")}
                </span>
              </span>
            </button>
          ))}
          <div className="border-t border-dashed border-[#9bbdce] p-4 text-xs text-[#5b7180]">
            โครงสร้างนี้รองรับการเพิ่มประเภทรายงานผ่าน Report Registry
          </div>
        </nav>
        <div className="min-w-0">
          <section className="bg-white ring-1 ring-[#cfe3ef]">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#cfe3ef] p-5 md:p-6">
              <div>
                <h2 className="text-lg font-bold text-[#063b66]">
                  {definition.title}
                </h2>
                <p className="mt-1 text-sm text-[#5b7180]">
                  {definition.description}
                </p>
              </div>
              {report === "production-loss" && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${withinTarget ? "bg-[#e5f6ed] text-[#147a4a]" : "bg-[#fff0ee] text-[#b42318]"}`}
                >
                  {withinTarget ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <AlertCircle size={15} />
                  )}{" "}
                  {withinTarget ? "อยู่ในเป้าหมาย" : "เกินเป้าหมาย"}
                </span>
              )}
            </div>
            {report === "production-loss" ? (
              <>
                <div className="grid border-b border-[#cfe3ef] md:grid-cols-3">
                  <ReportMetric
                    label="ปริมาณน้ำดิบ"
                    value={formatNumber(totalRaw)}
                    unit="ลบ.ม."
                  />
                  <ReportMetric
                    label="ปริมาณน้ำผลิตจ่าย"
                    value={formatNumber(totalProduced)}
                    unit="ลบ.ม."
                  />
                  <ReportMetric
                    label="น้ำสูญเสีย"
                    value={loss.toLocaleString("th-TH", {
                      maximumFractionDigits: 2,
                    })}
                    unit="%"
                    emphasized
                    status={
                      withinTarget ? "ผ่านเป้าหมาย ≤ 5%" : "เกินเป้าหมาย 5%"
                    }
                  />
                </div>
                <div className="bg-[#f8fbfd] px-5 py-3 text-xs text-[#5b7180] md:px-6">
                  <strong className="text-[#263f4e]">สูตรคำนวณ:</strong>{" "}
                  (ปริมาณน้ำดิบ − ปริมาณน้ำผลิตจ่าย) ÷ ปริมาณน้ำดิบ × 100
                </div>
              </>
            ) : (
              <div className="grid border-b border-[#cfe3ef] md:grid-cols-3">
                <ReportMetric
                  label={definition.title}
                  value={formatNumber(
                    report === "raw-water" ? totalRaw : totalProduced,
                  )}
                  unit="ลบ.ม."
                />
                <ReportMetric
                  label="จำนวนช่วงข้อมูล"
                  value={String(rows.length)}
                  unit="ช่วง"
                />
                <ReportMetric
                  label="ช่วงรายงาน"
                  value={
                    definition.periods.find((x) => x.key === period)?.label ??
                    ""
                  }
                  unit=""
                />
              </div>
            )}
            <div className="p-5 md:p-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {report === "production-loss" ? (
                    <LineChart data={rows}>
                      <CartesianGrid stroke="#dfedf4" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#5b7180", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 7]}
                        unit="%"
                        tick={{ fill: "#5b7180", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toFixed(2)}%`,
                          "น้ำสูญเสีย",
                        ]}
                      />
                      <ReferenceLine
                        y={5}
                        stroke="#b42318"
                        strokeDasharray="5 4"
                        label={{
                          value: "เป้าหมาย 5%",
                          fill: "#b42318",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="loss"
                        stroke="#087ac1"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={rows}>
                      <CartesianGrid stroke="#dfedf4" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#5b7180", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#5b7180", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${formatNumber(Number(value))} ลบ.ม.`,
                          definition.title,
                        ]}
                      />
                      <Bar
                        dataKey={report === "raw-water" ? "raw" : "produced"}
                        fill="#087ac1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </section>
          <section className="scrollbar mt-6 overflow-x-auto bg-white ring-1 ring-[#cfe3ef]">
            <div className="border-b border-[#cfe3ef] px-5 py-4 font-bold text-[#063b66]">
              รายละเอียดข้อมูล
            </div>
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead className="bg-[#eaf6fd] text-[#063b66]">
                <tr>
                  {report === "production-loss"
                    ? [
                        "ช่วงข้อมูล",
                        "น้ำดิบ (ลบ.ม.)",
                        "น้ำผลิตจ่าย (ลบ.ม.)",
                        "น้ำสูญเสีย",
                        "ผลเทียบเป้าหมาย",
                      ].map((h) => (
                        <th
                          key={h}
                          className="border-b border-[#cfe3ef] px-5 py-3"
                        >
                          {h}
                        </th>
                      ))
                    : ["ช่วงข้อมูล", "ปริมาณ (ลบ.ม.)", "สถานะข้อมูล"].map(
                        (h) => (
                          <th
                            key={h}
                            className="border-b border-[#cfe3ef] px-5 py-3"
                          >
                            {h}
                          </th>
                        ),
                      )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-[#e0edf4]">
                    <td className="px-5 py-4 font-bold">{row.label}</td>
                    {report === "production-loss" ? (
                      <>
                        <td className="tabular px-5 py-4">
                          {formatNumber(row.raw)}
                        </td>
                        <td className="tabular px-5 py-4">
                          {formatNumber(row.produced)}
                        </td>
                        <td className="tabular px-5 py-4 font-bold">
                          {row.loss.toFixed(2)}%
                        </td>
                        <td
                          className={`px-5 py-4 text-xs font-bold ${row.loss <= 5 ? "text-[#147a4a]" : "text-[#b42318]"}`}
                        >
                          {row.loss <= 5 ? "ผ่าน" : "เกิน 5%"}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="tabular px-5 py-4">
                          {formatNumber(
                            report === "raw-water" ? row.raw : row.produced,
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-[#147a4a]">
                          <CheckCircle2 size={14} className="mr-1 inline" />
                          สมบูรณ์
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {report !== "production-loss" && (
            <RecordManagement
              title={
                report === "raw-water"
                  ? "รายการบันทึกมาตรน้ำดิบและการแก้ไข"
                  : "รายการบันทึกมาตรหลักทางจ่ายและการแก้ไข"
              }
              readings={readings.filter(
                (item) =>
                  item.kind ===
                  (report === "raw-water" ? "raw" : "distribution"),
              )}
              setReadings={setReadings}
              role={role}
            />
          )}
        </div>
      </div>
    </div>
  );
}
function RecordManagement({
  title,
  readings,
  setReadings,
  role,
}: {
  title: string;
  readings: Reading[];
  setReadings: React.Dispatch<React.SetStateAction<Reading[]>>;
  role: Role;
}) {
  const [selected, setSelected] = useState<Reading | null>(null),
    [mode, setMode] = useState<"edit" | "cancel" | "audit" | null>(null),
    [reason, setReason] = useState(""),
    [draft, setDraft] = useState<Record<string, string>>({});
  const canManage = role === "Admin" || role === "Supervisor",
    canOperator = role === "Operator";
  const open = (reading: Reading, nextMode: "edit" | "cancel" | "audit") => {
    setSelected(reading);
    setMode(nextMode);
    setReason("");
    setDraft(
      Object.fromEntries(
        Object.entries(reading.values).map(([key, value]) => [
          key,
          String(value),
        ]),
      ),
    );
  };
  const close = () => {
    setSelected(null);
    setMode(null);
    setReason("");
  };
  const update = (
    reading: Reading,
    changes: Partial<Reading>,
    action: NonNullable<Reading["audit"]>[number],
  ) =>
    setReadings((items) =>
      items.map((item) =>
        item.id === reading.id
          ? {
              ...item,
              ...changes,
              audit: [
                ...(item.audit ?? [
                  {
                    id: `created-${item.id}`,
                    action: "created",
                    by: item.by,
                    at: item.createdAt,
                  },
                ]),
                action,
              ],
            }
          : item,
      ),
    );
  const actor =
    role === "Admin"
      ? "นายอำนาจ ทัฬหกิจ"
      : role === "Supervisor"
        ? "นายวิศิษฎ์ บุญมาศ"
        : "นายศราวุธ นิลโมจน์";
  const submitEdit = () => {
    if (
      !selected ||
      reason.trim().length < 5 ||
      Object.values(draft).some((value) => !/^\d+$/.test(value))
    )
      return;
    const after = Object.fromEntries(
      Object.entries(draft).map(([key, value]) => [key, Number(value)]),
    );
    update(
      selected,
      { values: after },
      {
        id: crypto.randomUUID(),
        action: "edited",
        by: actor,
        at: "เมื่อสักครู่",
        reason: reason.trim(),
        before: selected.values,
        after,
      },
    );
    close();
  };
  const submitCancel = () => {
    if (!selected || reason.trim().length < 5) return;
    const requestOnly = canOperator && !canManage;
    update(
      selected,
      { status: requestOnly ? "cancellation_requested" : "cancelled" },
      {
        id: crypto.randomUUID(),
        action: requestOnly ? "cancellation_requested" : "cancelled",
        by: actor,
        at: "เมื่อสักครู่",
        reason: reason.trim(),
      },
    );
    close();
  };
  const restore = (reading: Reading) =>
    update(
      reading,
      { status: "active" },
      {
        id: crypto.randomUUID(),
        action: "restored",
        by: actor,
        at: "เมื่อสักครู่",
        reason: "กู้คืนรายการโดยผู้ดูแลระบบ",
      },
    );
  const labels: Record<string, string> = {
    raw1: "มาตรน้ำดิบ 1",
    raw2: "มาตรน้ำดิบ 2",
    high: "มาตรหลักโซนสูง",
    low: "มาตรหลักโซนต่ำ",
    waeng: "มาตรหลักแว้ง",
  };
  return (
    <section className="mt-6 bg-white ring-1 ring-[#cfe3ef]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cfe3ef] px-5 py-4">
        <div>
          <h2 className="font-bold text-[#063b66]">{title}</h2>
          <p className="mt-1 text-xs text-[#5b7180]">
            แสดงเฉพาะข้อมูลต้นทางของรายงานนี้
            รายการที่ยกเลิกยังคงเก็บไว้เพื่อตรวจสอบย้อนหลังและไม่นำไปคำนวณ
          </p>
        </div>
        <span className="rounded-full bg-[#eaf6fd] px-3 py-1 text-xs font-bold text-[#087ac1]">
          {readings.length} รายการ
        </span>
      </div>
      <div className="scrollbar overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-[#f8fbfd] text-[#063b66]">
            <tr>
              {[
                "วันที่ / เวลา",
                "ประเภท",
                "ผู้บันทึก",
                "ค่ามาตร",
                "สถานะ",
                "ดำเนินการ",
              ].map((h) => (
                <th key={h} className="border-b border-[#cfe3ef] px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {readings.map((reading) => {
              const status = reading.status ?? "active";
              return (
                <tr
                  key={reading.id}
                  className={`border-b border-[#e0edf4] ${status === "cancelled" ? "bg-[#f3f5f6] text-[#5b7180]" : ""}`}
                >
                  <td className="tabular px-5 py-4">
                    {reading.date}
                    <div className="text-xs text-[#5b7180]">{reading.time}</div>
                  </td>
                  <td className="px-5 py-4 font-bold">
                    {reading.kind === "raw" ? "มาตรน้ำดิบ" : "มาตรหลักทางจ่าย"}
                  </td>
                  <td className="px-5 py-4">{reading.by}</td>
                  <td
                    className={`tabular px-5 py-4 ${status === "cancelled" ? "line-through" : ""}`}
                  >
                    {Object.values(reading.values)
                      .map(formatNumber)
                      .join(" / ")}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      {status === "active" && (canManage || canOperator) && (
                        <>
                          <button
                            onClick={() => open(reading, "edit")}
                            className="rounded-lg p-2 text-[#087ac1] hover:bg-[#eaf6fd]"
                            aria-label={`แก้ไขรายการ ${reading.time}`}
                            title="แก้ไข"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            onClick={() => open(reading, "cancel")}
                            className="rounded-lg p-2 text-[#b42318] hover:bg-[#fff0ee]"
                            aria-label={`${canOperator && !canManage ? "ขอยกเลิก" : "ยกเลิก"}รายการ ${reading.time}`}
                            title={
                              canOperator && !canManage ? "ขอยกเลิก" : "ยกเลิก"
                            }
                          >
                            <Trash2 size={17} />
                          </button>
                        </>
                      )}
                      {status === "cancelled" && role === "Admin" && (
                        <button
                          onClick={() => restore(reading)}
                          className="rounded-lg p-2 text-[#147a4a] hover:bg-[#e5f6ed]"
                          aria-label={`กู้คืนรายการ ${reading.time}`}
                          title="กู้คืน"
                        >
                          <RotateCcw size={17} />
                        </button>
                      )}
                      <button
                        onClick={() => open(reading, "audit")}
                        className="rounded-lg p-2 text-[#5b7180] hover:bg-[#edf3f6]"
                        aria-label={`ดูประวัติรายการ ${reading.time}`}
                        title="ประวัติ"
                      >
                        <History size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected && mode && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#062e4d]/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="confirm-in max-h-[90vh] w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start border-b border-[#cfe3ef] p-5">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#063b66]">
                  {mode === "edit"
                    ? "แก้ไขข้อมูลที่ยืนยันแล้ว"
                    : mode === "cancel"
                      ? canOperator && !canManage
                        ? "ส่งคำขอยกเลิกรายการ"
                        : "ยกเลิกรายการ"
                      : "ประวัติการเปลี่ยนแปลง"}
                </h2>
                <p className="mt-1 text-sm text-[#5b7180]">
                  {selected.date} · {selected.time} · {selected.by}
                </p>
              </div>
              <button onClick={close} className="p-1" aria-label="ปิด">
                <X />
              </button>
            </div>
            {mode === "edit" && (
              <div className="space-y-4 p-5">
                {Object.entries(draft).map(([key, value]) => (
                  <label key={key} className="block text-sm font-bold">
                    {labels[key]}
                    <input
                      value={value}
                      inputMode="numeric"
                      onChange={(e) =>
                        setDraft((values) => ({
                          ...values,
                          [key]: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className="tabular mt-2 w-full rounded-lg border border-[#9bbdce] px-3 py-2.5 text-right"
                    />
                  </label>
                ))}
                <Reason value={reason} onChange={setReason} />
                <DialogActions
                  onClose={close}
                  onSubmit={submitEdit}
                  disabled={
                    reason.trim().length < 5 ||
                    Object.values(draft).some((value) => !value)
                  }
                  submitLabel="ยืนยันการแก้ไข"
                />
              </div>
            )}
            {mode === "cancel" && (
              <div className="p-5">
                <div className="mb-4 bg-[#fff8f7] p-4 text-sm text-[#6d2923]">
                  <strong>ข้อมูลจะไม่ถูกลบถาวร</strong>
                  <p className="mt-1">
                    รายการจะถูกเก็บในประวัติและไม่นำไปคำนวณรายงาน
                    การยกเลิกอาจทำให้ต้องคำนวณผลต่างของรายการถัดไปใหม่
                  </p>
                </div>
                <Reason value={reason} onChange={setReason} />
                <DialogActions
                  onClose={close}
                  onSubmit={submitCancel}
                  disabled={reason.trim().length < 5}
                  submitLabel={
                    canOperator && !canManage
                      ? "ส่งคำขอยกเลิก"
                      : "ยืนยันการยกเลิก"
                  }
                  danger
                />
              </div>
            )}
            {mode === "audit" && (
              <div className="p-5">
                {(
                  selected.audit ?? [
                    {
                      id: "created",
                      action: "created" as const,
                      by: selected.by,
                      at: selected.createdAt,
                    },
                  ]
                )
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="border-b border-[#dcebf3] py-3 last:border-b-0"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="font-bold text-[#263f4e]">
                          {auditLabel(entry.action)}
                        </span>
                        <span className="text-xs text-[#5b7180]">
                          {entry.at}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-[#5b7180]">
                        โดย {entry.by}
                      </div>
                      {entry.reason && (
                        <div className="mt-1 text-sm">
                          เหตุผล: {entry.reason}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
function Reason({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-bold">
      เหตุผล <span className="text-[#b42318]">*</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={300}
        rows={3}
        placeholder="ระบุเหตุผลอย่างน้อย 5 ตัวอักษร"
        className="mt-2 w-full resize-y rounded-lg border border-[#9bbdce] px-3 py-2.5 font-normal"
      />
      <span className="mt-1 block text-right text-xs font-normal text-[#5b7180]">
        {value.length}/300
      </span>
    </label>
  );
}
function DialogActions({
  onClose,
  onSubmit,
  disabled,
  submitLabel,
  danger,
}: {
  onClose: () => void;
  onSubmit: () => void;
  disabled: boolean;
  submitLabel: string;
  danger?: boolean;
}) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        onClick={onClose}
        className="rounded-lg border border-[#87afc4] px-4 py-2.5 text-sm font-bold text-[#063b66]"
      >
        ปิดโดยไม่บันทึก
      </button>
      <button
        disabled={disabled}
        onClick={onSubmit}
        className={`rounded-lg px-4 py-2.5 text-sm font-bold text-white ${danger ? "bg-[#b42318]" : "bg-[#087ac1]"}`}
      >
        {submitLabel}
      </button>
    </div>
  );
}
function StatusBadge({ status }: { status: NonNullable<Reading["status"]> }) {
  const config = {
    active: ["สมบูรณ์", "bg-[#e5f6ed] text-[#147a4a]"],
    cancellation_requested: ["รออนุมัติยกเลิก", "bg-[#fff3d6] text-[#7a5200]"],
    cancelled: ["ยกเลิกแล้ว", "bg-[#edf0f2] text-[#445761]"],
  }[status];
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${config[1]}`}
    >
      {config[0]}
    </span>
  );
}
function auditLabel(action: NonNullable<Reading["audit"]>[number]["action"]) {
  return {
    created: "สร้างรายการ",
    edited: "แก้ไขข้อมูล",
    cancellation_requested: "ส่งคำขอยกเลิก",
    cancelled: "ยกเลิกรายการ",
    restored: "กู้คืนรายการ",
  }[action];
}
function ReportMetric({
  label,
  value,
  unit,
  emphasized,
  status,
}: {
  label: string;
  value: string;
  unit: string;
  emphasized?: boolean;
  status?: string;
}) {
  return (
    <div className="border-t border-[#cfe3ef] p-5 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0 md:p-6">
      <div className="text-sm text-[#5b7180]">{label}</div>
      <div
        className={`tabular mt-2 font-bold ${emphasized ? "text-3xl text-[#087ac1]" : "text-2xl text-[#063b66]"}`}
      >
        {value}{" "}
        <span className="text-sm font-normal text-[#5b7180]">{unit}</span>
      </div>
      {status && (
        <div className="mt-2 text-xs font-bold text-[#5b7180]">{status}</div>
      )}
    </div>
  );
}
function UsersPage({
  requests,
  setRequests,
}: {
  requests: AccessRequest[];
  setRequests: React.Dispatch<React.SetStateAction<AccessRequest[]>>;
}) {
  const update = (id: string, status: AccessRequest["status"], role?: Role) =>
    setRequests((items) =>
      items.map((item) => (item.id === id ? { ...item, status, role } : item)),
    );
  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="text-2xl font-bold text-[#063b66]">จัดการผู้ใช้งาน</h1>
      <p className="mt-1 text-sm text-[#5b7180]">
        ตรวจสอบคำขอ กำหนด Role และสถานะบัญชี
      </p>
      <section className="mt-6 bg-white ring-1 ring-[#cfe3ef]">
        <div className="flex items-center justify-between border-b border-[#cfe3ef] bg-[#eaf6fd] px-5 py-4">
          <h2 className="font-bold text-[#063b66]">คำขอเข้าใช้งานใหม่</h2>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#087ac1]">
            {requests.filter((x) => x.status === "pending").length} รอตรวจสอบ
          </span>
        </div>
        {requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#5b7180]">
            ยังไม่มีคำขอเข้าใช้งาน
          </div>
        ) : (
          <div className="divide-y divide-[#dcebf3]">
            {requests.map((request) => (
              <div key={request.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#263f4e]">
                      {request.fullName}
                    </div>
                    <div className="mt-1 text-sm text-[#5b7180]">
                      รหัสพนักงาน {request.employeeId} · {request.position}
                    </div>
                    <div className="mt-1 text-xs text-[#5b7180]">
                      {request.phone} · {request.email}
                    </div>
                  </div>
                  <StatusRequest status={request.status} />
                </div>
                {request.status === "pending" && (
                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <label className="text-xs font-bold text-[#5b7180]">
                      กำหนด Role
                      <select
                        id={`role-${request.id}`}
                        defaultValue="Operator"
                        className="ml-2 rounded-lg border border-[#9bbdce] px-3 py-2 text-sm font-bold text-[#063b66]"
                      >
                        {roles.map((role) => (
                          <option key={role}>{role}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      onClick={() => {
                        const el = document.getElementById(
                          `role-${request.id}`,
                        ) as HTMLSelectElement;
                        update(request.id, "approved", el.value as Role);
                      }}
                      className="rounded-lg bg-[#147a4a] px-4 py-2 text-sm font-bold text-white"
                    >
                      อนุมัติและเปิดใช้งาน
                    </button>
                    <button
                      onClick={() => update(request.id, "rejected")}
                      className="rounded-lg border border-[#b42318] px-4 py-2 text-sm font-bold text-[#b42318]"
                    >
                      ไม่อนุมัติ
                    </button>
                  </div>
                )}
                {request.role && (
                  <div className="mt-3 text-xs text-[#5b7180]">
                    Role ที่กำหนด:{" "}
                    <strong className="text-[#063b66]">{request.role}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="scrollbar mt-6 overflow-x-auto bg-white ring-1 ring-[#cfe3ef]">
        <div className="border-b border-[#cfe3ef] px-5 py-4 font-bold text-[#063b66]">
          บัญชีผู้ใช้งานปัจจุบัน
        </div>
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="bg-[#f8fbfd] text-[#063b66]">
            <tr>
              <th className="border-b border-[#cfe3ef] px-5 py-3">
                ชื่อ–นามสกุล
              </th>
              <th className="border-b border-[#cfe3ef] px-5 py-3">ตำแหน่ง</th>
              <th className="border-b border-[#cfe3ef] px-5 py-3">Role</th>
              <th className="border-b border-[#cfe3ef] px-5 py-3">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {systemUsers.map((user) => (
              <tr key={user.name} className="border-b border-[#e0edf4]">
                <td className="px-5 py-4 font-bold text-[#263f4e]">
                  {user.name}
                </td>
                <td className="px-5 py-4">{user.position}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-[#eaf6fd] px-3 py-1 text-xs font-bold text-[#087ac1]">
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#147a4a]">
                    <CheckCircle2 size={14} />
                    ใช้งาน
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
function StatusRequest({ status }: { status: AccessRequest["status"] }) {
  const config = {
    pending: ["รอตรวจสอบ", "bg-[#fff3d6] text-[#7a5200]"],
    approved: ["อนุมัติแล้ว", "bg-[#e5f6ed] text-[#147a4a]"],
    rejected: ["ไม่อนุมัติ", "bg-[#fff0ee] text-[#b42318]"],
  }[status];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${config[1]}`}>
      {config[0]}
    </span>
  );
}
function Placeholder({ page }: { page: "settings" }) {
  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="text-2xl font-bold text-[#063b66]">ตั้งค่าระบบ</h1>
      <div className="mt-6 border border-dashed border-[#8bb8ce] bg-white p-10 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#eaf6fd] text-[#087ac1]">
          <Settings />
        </div>
        <h2 className="mt-4 font-bold">
          เตรียมไว้สำหรับระยะเชื่อมต่อ Supabase
        </h2>
        <p className="mt-1 text-sm text-[#5b7180]">
          ฟังก์ชันนี้ยังไม่เปิดใช้งานใน UI MVP
        </p>
      </div>
    </div>
  );
}
