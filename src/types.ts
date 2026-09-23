export type ItemStatus = "ok" | "observe" | "defect";

export interface ItemRecord {
  status: ItemStatus | null;
  defectDescription: string;
  disposition: string;
}

export type SheetStatus = "draft" | "submitted" | "returned" | "released";

export interface Sheet {
  id: string;
  aircraftType: string;
  registration: string;
  inspector: string;
  status: SheetStatus;
  items: Record<string, ItemRecord>;
  returnReason: string;
  reviewer: string;
  createdAt: number;
  updatedAt: number;
  submittedAt: number | null;
  releasedAt: number | null;
}

export type Role = "engineer" | "reviewer";
