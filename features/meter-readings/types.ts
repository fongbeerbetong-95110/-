export type Role = "Admin" | "Manager" | "Supervisor" | "Operator" | "Viewer";
export type MeterKind = "raw" | "distribution";
export type MeterField = { key: string; label: string; previous: number };
export type ReadingStatus = "active" | "cancellation_requested" | "cancelled";
export type AuditEntry = {
  id: string;
  action:
    "created" | "edited" | "cancellation_requested" | "cancelled" | "restored";
  by: string;
  at: string;
  reason?: string;
  before?: Record<string, number>;
  after?: Record<string, number>;
};
export type Reading = {
  id: string;
  kind: MeterKind;
  date: string;
  time: string;
  values: Record<string, number>;
  differences?: Record<string, number | null>;
  by: string;
  createdAt: string;
  status?: ReadingStatus;
  audit?: AuditEntry[];
};
export type MeterConfiguration = {
  stationId: string;
  stationCode: string;
  stationName: string;
  groupIds: Record<MeterKind, string>;
};
