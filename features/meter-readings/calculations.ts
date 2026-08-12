export const difference=(current:string,previous:number)=>current===""?null:Number(current)-previous;
export const formatNumber=(n:number)=>new Intl.NumberFormat("th-TH",{maximumFractionDigits:0}).format(Math.trunc(n));
