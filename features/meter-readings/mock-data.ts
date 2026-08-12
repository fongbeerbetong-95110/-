import { Reading } from "./types";
export const initialReadings:Reading[]=[
 {id:"1",kind:"raw",date:"2026-08-12",time:"06.00 น.",values:{raw1:128540,raw2:98410},by:"นายศราวุธ นิลโมจน์",createdAt:"12 ส.ค. 2569 06:04"},
 {id:"2",kind:"distribution",date:"2026-08-12",time:"05.00 น.",values:{high:87520,low:112680,waeng:45312},by:"นายธนเดช สะมะแอ",createdAt:"12 ส.ค. 2569 05:03"},
 {id:"3",kind:"distribution",date:"2026-08-12",time:"04.00 น.",values:{high:87401,low:112542,waeng:45248},by:"นายธนเดช สะมะแอ",createdAt:"12 ส.ค. 2569 04:05"},
];
export const rawFields=[{key:"raw1",label:"มาตรน้ำดิบ 1",previous:128540},{key:"raw2",label:"มาตรน้ำดิบ 2",previous:98410}];
export const distributionFields=[{key:"high",label:"มาตรหลักโซนสูง",previous:87520},{key:"low",label:"มาตรหลักโซนต่ำ",previous:112680},{key:"waeng",label:"มาตรหลักแว้ง",previous:45312}];
export const rawTimes=["00.00 น.","06.00 น.","14.00 น.","22.00 น."];
export const hourlyTimes=Array.from({length:24},(_,i)=>`${String(i).padStart(2,"0")}.00 น.`);

export const systemUsers=[
 {name:"นายอำนาจ ทัฬหกิจ",position:"หัวหน้าผลิต",role:"Admin"},
 {name:"นายศราวุธ นิลโมจน์",position:"ผู้ปฏิบัติงาน",role:"Operator"},
 {name:"นายธนเดช สะมะแอ",position:"ผู้ปฏิบัติงาน",role:"Operator"},
 {name:"นายณฐพล บุญคง",position:"ผู้ปฏิบัติงาน",role:"Operator"},
 {name:"นายวิศิษฎ์ บุญมาศ",position:"หัวหน้าประจำสถานี",role:"Supervisor"},
] as const;
