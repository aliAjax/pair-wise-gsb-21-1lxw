import { useEffect, useState } from "react";
import "./styles.css";
import type { Role, Sheet } from "./types";
import { emptyItems } from "./checklist";
import { loadRole, loadSheets, saveRole, saveSheets } from "./store";
import Dashboard from "./components/Dashboard";
import SheetDetail from "./components/SheetDetail";

export default function App() {
  const [sheets, setSheets] = useState<Sheet[]>(loadSheets);
  const [role, setRole] = useState<Role>(loadRole);
  const [openId, setOpenId] = useState<string | null>(null);

  // 任何变更立即写入本机浏览器，实现填写过程自动保存
  useEffect(() => saveSheets(sheets), [sheets]);
  useEffect(() => saveRole(role), [role]);

  const updateSheet = (id: string, updater: (s: Sheet) => Sheet) => {
    setSheets((prev) =>
      prev.map((s) => (s.id === id ? { ...updater(s), updatedAt: Date.now() } : s))
    );
  };

  const createSheet = (aircraftType: string, registration: string) => {
    const now = Date.now();
    const sheet: Sheet = {
      id: `CHK-${now.toString(36).toUpperCase()}`,
      aircraftType,
      registration,
      inspector: "",
      status: "draft",
      items: emptyItems(),
      returnReason: "",
      reviewer: "",
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      releasedAt: null,
    };
    setSheets((prev) => [sheet, ...prev]);
    setOpenId(sheet.id);
  };

  const deleteSheet = (id: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== id));
    setOpenId((cur) => (cur === id ? null : cur));
  };

  const open = sheets.find((s) => s.id === openId) ?? null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">hxwl-07 · 维修部班前检查</p>
          <h1>维修放行检查工作台</h1>
          <p className="subtitle">
            按机型建立检查单，在 ATA 章节下记录正常 / 观察 / 缺陷；提交后由放行人员复核，放行后内容固定。
          </p>
        </div>
        <div className="role-card">
          <span>当前角色</span>
          <div className="seg role-seg">
            <button
              className={role === "engineer" ? "active" : ""}
              onClick={() => setRole("engineer")}
            >
              维修工程师
            </button>
            <button
              className={role === "reviewer" ? "active" : ""}
              onClick={() => setRole("reviewer")}
            >
              放行人员
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <SheetDetail
          sheet={open}
          role={role}
          onBack={() => setOpenId(null)}
          onUpdate={(updater) => updateSheet(open.id, updater)}
        />
      ) : (
        <Dashboard
          sheets={sheets}
          onOpen={setOpenId}
          onCreate={createSheet}
          onDelete={deleteSheet}
        />
      )}
    </main>
  );
}
