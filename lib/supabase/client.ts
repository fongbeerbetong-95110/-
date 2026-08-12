import {createClient,type SupabaseClient} from "@supabase/supabase-js";
import {isSupabaseConfigured,supabaseAnonKey,supabaseUrl} from "./config";

let browserClient:SupabaseClient|null=null;

export function getSupabaseBrowserClient(){
 if(!isSupabaseConfigured)return null;
 browserClient??=createClient(supabaseUrl,supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 return browserClient;
}
