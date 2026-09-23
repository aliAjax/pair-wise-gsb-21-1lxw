export type ItemResult = "normal" | "watch" | "defect";

export type ChecklistStatus = "draft" | "submitted" | "returned" | "released";

export interface CheckItem {
  id: string;
  ata: string;
  ataName: string;
  title: string;
  result: ItemResult | null;
  defectDesc: string;
  action: string;
}

export interface Checklist {
  id: string;
  aircraftType: string;
  regNo: string;
  createdBy: string;
  createdAt: string;
  status: ChecklistStatus;
  items: CheckItem[];
  inspectorSign: string;
  submittedAt: string | null;
  returnReason: string;
  reviewerSign: string;
  releasedAt: string | null;
}
