export type Json=string|number|boolean|null|{[key:string]:Json|undefined}|Json[];
export type AccessRequestStatus="pending"|"approved"|"rejected"|"cancelled";
export type ReadingStatus="active"|"cancellation_requested"|"cancelled";
export type ReadingType="raw_water"|"distribution";

export type AccessRequestRow={id:string;request_no:string;employee_id:string;full_name:string;position:string;phone:string;email:string;status:AccessRequestStatus;assigned_role_id:string|null;reviewed_by:string|null;reviewed_at:string|null;rejection_reason:string|null;created_at:string;updated_at:string};
export type ReadingSessionRow={id:string;station_id:string;meter_group_id:string;reading_date:string;reading_time:string;observed_at:string;status:ReadingStatus;source:"manual"|"api"|"sensor"|"import";recorded_by:string;recorded_at:string;updated_at:string;lock_version:number};
export type MeterReadingRow={id:string;session_id:string;meter_id:string;reading_value:number;previous_reading_id:string|null;previous_value:number|null;difference_value:number|null;quality_status:string;created_at:string;updated_at:string};
