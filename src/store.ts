import type { Role, Sheet } from "./types";

const SHEETS_KEY = "hxwl07.sheets.v1";
const ROLE_KEY = "hxwl07.role.v1";

export function loadSheets(): Sheet[] {
  try {
    const raw = localStorage.getItem(SHEETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Sheet[]) : [];
  } catch {
    return [];
  }
}

export function saveSheets(sheets: Sheet[]): void {
  try {
    localStorage.setItem(SHEETS_KEY, JSON.stringify(sheets));
  } catch {
    // 存储不可用时静默失败，页面内状态仍可用
  }
}

export function loadRole(): Role {
  try {
    return localStorage.getItem(ROLE_KEY) === "reviewer" ? "reviewer" : "engineer";
  } catch {
    return "engineer";
  }
}

export function saveRole(role: Role): void {
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {
    // 忽略
  }
}
