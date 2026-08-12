import {getSupabaseBrowserClient} from "@/lib/supabase/client";
import {isSupabaseConfigured} from "@/lib/supabase/config";

export type NewAccessRequest={employeeId:string;fullName:string;position:string;phone:string;email:string};

export async function signIn(email:string,password:string){
 const client=getSupabaseBrowserClient();
 if(!client)return {demo:true};
 if(!email.includes("@"))throw new Error("เมื่อเชื่อม Supabase กรุณาใช้อีเมลเข้าสู่ระบบ รหัสพนักงานจะเปิดใช้หลังติดตั้ง Edge Function");
 const {error}=await client.auth.signInWithPassword({email,password});
 if(error)throw new Error(error.message==="Invalid login credentials"?"อีเมลหรือรหัสผ่านไม่ถูกต้อง":error.message);
 return {demo:false};
}

export async function signOut(){
 const client=getSupabaseBrowserClient();
 if(client)await client.auth.signOut();
}

export async function getCurrentUserAccess(){
 const client=getSupabaseBrowserClient();
 if(!client)return null;
 const {data:{user}}=await client.auth.getUser();
 if(!user)return null;
 const {data:profile,error:profileError}=await client.from("profiles").select("id,full_name,account_status,must_change_password").eq("id",user.id).single();
 if(profileError||!profile)throw new Error("พบบัญชี Authentication แต่ยังไม่มี Profile ในระบบ");
 if(profile.account_status!=="active")throw new Error("บัญชียังไม่ได้รับอนุมัติหรือถูกระงับการใช้งาน");
 const {data:assignments,error:roleError}=await client.from("user_station_roles").select("roles(code),stations(code,name_th)").eq("user_id",user.id).is("effective_to",null);
 if(roleError)throw new Error("ไม่สามารถโหลดสิทธิ์ผู้ใช้งานได้");
 const roleCode=(assignments?.[0]?.roles as unknown as {code:string}|null)?.code;
 const roleMap:Record<string,"Admin"|"Manager"|"Supervisor"|"Operator"|"Viewer">={admin:"Admin",manager:"Manager",supervisor:"Supervisor",operator:"Operator",viewer:"Viewer"};
 if(!roleCode||!roleMap[roleCode])throw new Error("บัญชียังไม่ได้รับการกำหนด Role และสถานี");
 return {userId:user.id,fullName:String(profile.full_name),role:roleMap[roleCode],mustChangePassword:Boolean(profile.must_change_password)};
}

export async function submitAccessRequest(input:NewAccessRequest){
 const client=getSupabaseBrowserClient();
 const requestNo=`REQ-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
 if(!client)return {id:crypto.randomUUID(),requestNo,demo:true};
 const {data,error}=await client.rpc("submit_access_request",{p_employee_id:input.employeeId,p_full_name:input.fullName,p_position:input.position,p_phone:input.phone,p_email:input.email,p_request_no:requestNo});
 if(error)throw new Error(error.message.includes("duplicate")?"รหัสพนักงานหรืออีเมลนี้มีคำขออยู่แล้ว":error.message);
 return {id:String(data),requestNo,demo:false};
}

export {isSupabaseConfigured};
