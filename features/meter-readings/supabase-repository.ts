import {getSupabaseBrowserClient} from "@/lib/supabase/client";
import type {MeterKind,Reading} from "./types";

type CreateReadingInput={stationId:string;meterGroupId:string;kind:MeterKind;date:string;time:string;values:Record<string,number>};

export async function loadReadings(stationId:string):Promise<Reading[]>{
 const client=getSupabaseBrowserClient();
 if(!client)return [];
 const {data,error}=await client.from("reading_session_details").select("*").eq("station_id",stationId).order("observed_at",{ascending:false}).limit(200);
 if(error)throw error;
 const grouped=new Map<string,Reading>();
 for(const row of data??[]){
  const id=String(row.session_id);const current:Reading=grouped.get(id)??{id,kind:row.reading_type==="raw_water"?"raw":"distribution",date:String(row.reading_date),time:`${String(row.reading_time).slice(0,5).replace(":",".")} น.`,values:{},by:String(row.recorded_by_name??"ไม่ระบุ"),createdAt:String(row.recorded_at),status:row.status};
  current.values[String(row.meter_code).toLowerCase()]=Number(row.reading_value);grouped.set(id,current);
 }
 return [...grouped.values()];
}

export async function createReading(input:CreateReadingInput){
 const client=getSupabaseBrowserClient();
 if(!client)return null;
 const {data,error}=await client.rpc("create_reading_session",{p_station_id:input.stationId,p_meter_group_id:input.meterGroupId,p_reading_date:input.date,p_reading_time:input.time.replace(".",":").replace(" น.",""),p_values:input.values});
 if(error)throw error;
 return String(data);
}
