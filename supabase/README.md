# Supabase Setup

## 1. สร้างและเชื่อม Project

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Migration จะสร้าง schema, RLS, seed สถานี/มาตร/กะ และ RPC เริ่มต้นตาม `database.md`

## 2. Environment

คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่าจาก Supabase Project Settings > API

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

ห้ามใช้ `SUPABASE_SERVICE_ROLE_KEY` ใน Client Component หรือส่งขึ้น Git

## 3. สร้าง Admin คนแรก

Admin คนแรกต้องสร้างผ่าน Supabase Dashboard หรือ secure server script แล้วเพิ่ม `profiles` และ `user_station_roles` ด้วย service role การอนุมัติผู้ใช้ทั่วไปในระยะถัดไปควรทำผ่าน Edge Function เพื่อสร้าง Auth user โดยไม่เปิด service role ให้ browser

## 4. Integration status

- พร้อม: browser client, environment guard, password sign-in service, access-request RPC, reading repository, schema, RLS พื้นฐาน, seed และ create-reading RPC
- UI ใช้ข้อมูลจริงจาก Supabase สำหรับ Authentication, สถานี, มาตร, Dashboard, รายงาน, คำขอเข้าใช้งาน และผู้ใช้
- ต้องรัน migrations ตามลำดับถึง `202608120004_admin_and_reading_operations.sql`
- เมื่อไม่มี environment variables ระบบจะแจ้งว่ายังไม่ได้ตั้งค่า Supabase และไม่สร้างข้อมูลจำลอง

## 5. Generate types

```bash
npx supabase gen types typescript --linked > lib/supabase/generated.types.ts
```

จากนั้นเปลี่ยน Supabase client ให้ใช้ generic `createClient<Database>()`
