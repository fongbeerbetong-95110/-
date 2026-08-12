import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "ระบบบริหารจัดการข้อมูลการผลิตน้ำ", description: "งานผลิต กปภ.สาขาสุไหงโก-ลก" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{/*
THESIS: แบบบันทึกปฏิบัติงานดิจิทัลที่เห็นรอบเวลา ค่าก่อนหน้า และผลต่างในจังหวะเดียว โดยไม่ใช้ dashboard card wall เป็นแกน
OWN-WORLD: ฟ้า กปภ. บนพื้นขาว เส้นแบ่งแบบเอกสารราชการร่วมสมัย ตารางโปร่ง และตัวเลขแบบ tabular
STORY: ผู้ใช้เห็นความครบถ้วน เลือกแบบฟอร์ม กรอกค่า ตรวจผลต่าง และยืนยันอย่างมั่นใจ
FIRST VIEWPORT: sidebar คงที่ แถบสถานีด้านบน สถานะรอบวันนี้และกราฟการจ่ายน้ำวางบนพื้นที่ทำงานกว้าง
FORM: government-service canon, code-led, seed 0762c3d6
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/}{children}</body></html>;
}
