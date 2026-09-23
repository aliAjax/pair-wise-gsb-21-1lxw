import { Checklist } from "./types";

const KEY = "hxwl07.checklists.v1";

export function loadChecklists(): Checklist[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Checklist[]) : [];
  } catch {
    return [];
  }
}

export function saveChecklists(list: Checklist[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 存储失败（如隐私模式）时静默忽略，页面内状态仍可用
  }
}
