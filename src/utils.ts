import { ATA_TEMPLATE } from "./checklist";
import type { Sheet, SheetStatus } from "./types";

export const STATUS_LABEL: Record<SheetStatus, string> = {
  draft: "草稿",
  submitted: "待复核",
  returned: "已退回",
  released: "已放行",
};

export function fmtTime(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("zh-CN", { hour12: false });
}

export interface SheetProgress {
  done: number;
  defects: number;
}

export function sheetProgress(sheet: Sheet): SheetProgress {
  let done = 0;
  let defects = 0;
  for (const rec of Object.values(sheet.items)) {
    if (rec.status) done += 1;
    if (rec.status === "defect") defects += 1;
  }
  return { done, defects };
}

export function chapterProgress(sheet: Sheet, ata: string): SheetProgress {
  const ch = ATA_TEMPLATE.find((c) => c.ata === ata);
  let done = 0;
  let defects = 0;
  if (!ch) return { done, defects };
  for (const it of ch.items) {
    const rec = sheet.items[it.id];
    if (rec?.status) done += 1;
    if (rec?.status === "defect") defects += 1;
  }
  return { done, defects };
}

/** 提交前校验：签署人必填、每项必须有结果、缺陷必须写描述和处理意见 */
export function validateSheet(sheet: Sheet): string[] {
  const errors: string[] = [];
  if (!sheet.inspector.trim()) {
    errors.push("请填写签署人");
  }
  for (const ch of ATA_TEMPLATE) {
    for (const it of ch.items) {
      const rec = sheet.items[it.id];
      if (!rec || !rec.status) {
        errors.push(`${ch.ata} · ${it.title}：未选择检查结果`);
        continue;
      }
      if (rec.status === "defect") {
        if (!rec.defectDescription.trim()) {
          errors.push(`${ch.ata} · ${it.title}：缺陷项必须填写缺陷描述`);
        }
        if (!rec.disposition.trim()) {
          errors.push(`${ch.ata} · ${it.title}：缺陷项必须填写处理意见`);
        }
      }
    }
  }
  return errors;
}

export interface AtaSummary {
  ata: string;
  name: string;
  done: number;
  total: number;
  defects: number;
  pending: number;
}

/** 跨检查单按 ATA 汇总：完成量、缺陷项、待复核量 */
export function summarizeByAta(sheets: Sheet[]): AtaSummary[] {
  return ATA_TEMPLATE.map((ch) => {
    let done = 0;
    let total = 0;
    let defects = 0;
    let pending = 0;
    for (const s of sheets) {
      for (const it of ch.items) {
        const rec = s.items[it.id];
        total += 1;
        if (rec?.status) done += 1;
        if (rec?.status === "defect") defects += 1;
        if (s.status === "submitted" && rec?.status) pending += 1;
      }
    }
    return { ata: ch.ata, name: ch.name, done, total, defects, pending };
  });
}
