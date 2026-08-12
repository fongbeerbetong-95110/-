export type ReportKey="raw-water"|"produced-water"|"production-loss";
export type ReportPeriod="shift"|"hour"|"day"|"month"|"fiscal-year";

export type ReportDefinition={
 key:ReportKey;
 title:string;
 description:string;
 periods:{key:ReportPeriod;label:string}[];
 unit:string;
};

export const reportDefinitions:ReportDefinition[]=[
 {key:"raw-water",title:"ปริมาณน้ำดิบ",description:"สรุปผลต่างรวมจากมาตรน้ำดิบ 1 และมาตรน้ำดิบ 2",periods:[{key:"shift",label:"รายกะ"},{key:"day",label:"รายวัน"},{key:"month",label:"รายเดือน"},{key:"fiscal-year",label:"รายปีงบประมาณ"}],unit:"ลบ.ม."},
 {key:"produced-water",title:"ปริมาณน้ำผลิตจ่าย",description:"สรุปผลต่างรวมจากมาตรหลักโซนสูง โซนต่ำ และแว้ง",periods:[{key:"hour",label:"รายชั่วโมง"},{key:"day",label:"รายวัน"},{key:"month",label:"รายเดือน"},{key:"fiscal-year",label:"รายปีงบประมาณ"}],unit:"ลบ.ม."},
 {key:"production-loss",title:"ปริมาณน้ำสูญเสียในระบบผลิต",description:"ติดตามสัดส่วนน้ำสูญเสียเทียบเป้าหมายไม่เกิน 5%",periods:[{key:"day",label:"รายวัน"},{key:"month",label:"รายเดือน"},{key:"fiscal-year",label:"รายปีงบประมาณ"}],unit:"%"},
];

export type ReportDataPoint={label:string;raw:number;produced:number};

const shiftData:ReportDataPoint[]=[
 {label:"กะที่ 1 · 06.00–14.00",raw:3140,produced:2996},
 {label:"กะที่ 2 · 14.00–22.00",raw:3275,produced:3121},
 {label:"กะที่ 3 · 22.00–06.00 (วันถัดไป)",raw:3090,produced:2950},
];
const hourlyData:ReportDataPoint[]=Array.from({length:24},(_,hour)=>({label:`${String(hour).padStart(2,"0")}.00 น.`,raw:390+(hour*17)%125,produced:373+(hour*16)%118}));
const dailyData:ReportDataPoint[]=[7,8,9,10,11,12].map((day,index)=>({label:`${day} ส.ค. 2569`,raw:[9580,9700,9460,9635,9515,9505][index],produced:[9154,9275,8997,9204,9068,9067][index]}));
const monthlyData:ReportDataPoint[]=["มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค."].map((month,index)=>({label:`${month} 2569`,raw:[286400,279800,291300,284900,294100,114060][index],produced:[273200,267100,277900,272000,280700,108730][index]}));
const fiscalYearData:ReportDataPoint[]=["2566","2567","2568","2569"].map((year,index)=>({label:`ปีงบประมาณ ${year}`,raw:[3410000,3495000,3542000,2284600][index],produced:[3261000,3336000,3384000,2181900][index]}));

const dataByPeriod:Record<ReportPeriod,ReportDataPoint[]>={shift:shiftData,hour:hourlyData,day:dailyData,month:monthlyData,"fiscal-year":fiscalYearData};
export const getReportSeries=(_report:ReportKey,period:ReportPeriod)=>dataByPeriod[period];

export const productionLossPercent=(raw:number,produced:number)=>raw<=0?0:((raw-produced)/raw)*100;
