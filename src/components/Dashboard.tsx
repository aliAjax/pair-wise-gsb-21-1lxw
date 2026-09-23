import { useState } from "react";
import type { Sheet } from "../types";
import { AIRCRAFT_TYPES, TOTAL_ITEMS } from "../checklist";
import { STATUS_LABEL, fmtTime, sheetProgress, summarizeByAta } from "../utils";

interface Props {
  sheets: Sheet[];
  onOpen: (id: string) => void;
  onCreate: (aircraftType: string, registration: string) => void;
  onDelete: (id: string) => void;
}

export default function Dashboard({ sheets, onOpen, onCreate, onDelete }: Props) {
  const [aircraftType, setAircraftType] = useState(AIRCRAFT_TYPES[0]);
  const [registration, setRegistration] = useState("");

  const summary = summarizeByAta(sheets);
  const pendingCount = sheets.filter((s) => s.status === "submitted").length;
  const releasedCount = sheets.filter((s) => s.status === "released").length;
  const defectTotal = sheets.reduce((n, s) => n + sheetProgress(s).defects, 0);
  const sorted = [...sheets].sort((a, b) => b.updatedAt - a.updatedAt);

  const create = () => {
    if (!registration.trim()) return;
    onCreate(aircraftType, registration.trim().toUpperCase());
    setRegistration("");
  };

  return (
    <>
      <section className="metrics-grid">
        <article className="metric-card">
          <span>检查单总数</span>
          <strong>{sheets.length}</strong>
          <i className="status-ok" />
        </article>
        <article className="metric-card">
          <span>待复核</span>
          <strong>{pendingCount}</strong>
          <i className="status-watch" />
        </article>
        <article className="metric-card">
          <span>缺陷项</span>
          <strong>{defectTotal}</strong>
          <i className="status-danger" />
        </article>
        <article className="metric-card">
          <span>已放行</span>
          <strong>{releasedCount}</strong>
          <i className="status-ok" />
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>按 ATA 汇总</p>
            <h2>完成量 · 缺陷项 · 待复核量</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="ata-table">
            <thead>
              <tr>
                <th>ATA 章节</th>
                <th>系统</th>
                <th>完成量</th>
                <th>缺陷项</th>
                <th>待复核量</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.ata}>
                  <td>{row.ata}</td>
                  <td>{row.name}</td>
                  <td>
                    {row.done}/{row.total}
                    <span className="bar">
                      <span
                        className="bar-fill"
                        style={{ width: row.total ? `${(row.done / row.total) * 100}%` : 0 }}
                      />
                    </span>
                  </td>
                  <td className={row.defects > 0 ? "num-danger" : ""}>{row.defects}</td>
                  <td className={row.pending > 0 ? "num-warn" : ""}>{row.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>新建</p>
            <h2>按机型建立检查单</h2>
          </div>
        </div>
        <div className="create-row">
          <label>
            <span>机型</span>
            <select value={aircraftType} onChange={(e) => setAircraftType(e.target.value)}>
              {AIRCRAFT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>飞机注册号</span>
            <input
              value={registration}
              placeholder="如 B-1234"
              onChange={(e) => setRegistration(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
          </label>
          <button className="primary-action" onClick={create} disabled={!registration.trim()}>
            新建检查单
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>交接</p>
            <h2>检查单列表</h2>
          </div>
        </div>
        {sorted.length === 0 ? (
          <p className="empty-hint">还没有检查单。选择机型并填写注册号，建立第一份班前检查单。</p>
        ) : (
          <div className="record-list">
            {sorted.map((s) => {
              const p = sheetProgress(s);
              return (
                <article key={s.id} className="record-card">
                  <div className="record-index">{s.aircraftType.slice(0, 2)}</div>
                  <div className="record-main">
                    <h3>
                      {s.aircraftType} · {s.registration}
                      <span className={`badge badge-${s.status}`}>{STATUS_LABEL[s.status]}</span>
                    </h3>
                    <p>
                      完成 {p.done}/{TOTAL_ITEMS} · 缺陷 {p.defects} · 签署人{" "}
                      {s.inspector || "未签署"} · 更新于 {fmtTime(s.updatedAt)}
                    </p>
                    {s.status === "returned" && s.returnReason && (
                      <p className="return-line">退回原因：{s.returnReason}</p>
                    )}
                  </div>
                  <div className="record-actions">
                    <button onClick={() => onOpen(s.id)}>打开</button>
                    {s.status !== "released" && (
                      <button
                        className="danger-action"
                        onClick={() => {
                          if (window.confirm("确定删除该检查单？此操作不可恢复。")) onDelete(s.id);
                        }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
