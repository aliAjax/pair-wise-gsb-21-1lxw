import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { CheckItem, Checklist, ChecklistStatus, ItemResult } from "./types";
import { AIRCRAFT_TYPES, ATA_TEMPLATE, RESULT_LABELS, STATUS_LABELS } from "./data";
import { loadChecklists, saveChecklists } from "./storage";

type Role = "engineer" | "reviewer";

const ROLE_KEY = "hxwl07.role";

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function now(): string {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

function buildItems(): CheckItem[] {
  return ATA_TEMPLATE.flatMap((chapter) =>
    chapter.items.map((title) => ({
      id: uid(),
      ata: chapter.ata,
      ataName: chapter.name,
      title,
      result: null,
      defectDesc: "",
      action: "",
    }))
  );
}

function validateForSubmit(cl: Checklist): string[] {
  const errors: string[] = [];
  for (const item of cl.items) {
    if (!item.result) {
      errors.push(`${item.ata}「${item.title}」尚未填写检查结果`);
    } else if (item.result === "defect") {
      if (!item.defectDesc.trim()) errors.push(`${item.ata}「${item.title}」为缺陷项，需填写缺陷描述`);
      if (!item.action.trim()) errors.push(`${item.ata}「${item.title}」为缺陷项，需填写处理意见`);
    }
  }
  if (!cl.inspectorSign.trim()) errors.push("请填写维修工程师签署后再提交");
  return errors;
}

interface Stats {
  total: number;
  done: number;
  defects: number;
  watch: number;
  pct: number;
}

function statsOf(cl: Checklist): Stats {
  const total = cl.items.length;
  const done = cl.items.filter((i) => i.result !== null).length;
  const defects = cl.items.filter((i) => i.result === "defect").length;
  const watch = cl.items.filter((i) => i.result === "watch").length;
  return { total, done, defects, watch, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

function StatusBadge({ status }: { status: ChecklistStatus }) {
  return <span className={`badge b-${status}`}>{STATUS_LABELS[status]}</span>;
}

function MetricCard({ label, value, index }: { label: string; value: string; index: number }) {
  const colors = ["status-ok", "status-watch", "status-danger", "status-info"];
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <i className={colors[index % colors.length]} />
    </article>
  );
}

function NewChecklistForm({
  onCreate,
  onCancel,
}: {
  onCreate: (aircraftType: string, regNo: string, createdBy: string) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState(AIRCRAFT_TYPES[0]);
  const [regNo, setRegNo] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <form
      className="new-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!createdBy.trim()) {
          setMsg("请填写检查员（签署人）");
          return;
        }
        onCreate(type, regNo.trim(), createdBy.trim());
      }}
    >
      <label>
        <span>机型 *</span>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {AIRCRAFT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>注册号</span>
        <input value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="如 B-1234" />
      </label>
      <label>
        <span>检查员 *</span>
        <input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} placeholder="签署人姓名/执照号" />
      </label>
      {msg && <p className="error-text">{msg}</p>}
      <div className="new-form-actions">
        <button type="submit" className="primary-action">
          创建检查单
        </button>
        <button type="button" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}

function ChecklistCard({
  cl,
  active,
  onSelect,
  onDelete,
}: {
  cl: Checklist;
  active: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
}) {
  const st = statsOf(cl);
  return (
    <article className={`cl-card${active ? " active" : ""}`} onClick={onSelect}>
      <div className="cl-card-top">
        <strong>
          {cl.aircraftType}
          {cl.regNo ? ` · ${cl.regNo}` : ""}
        </strong>
        <StatusBadge status={cl.status} />
      </div>
      <p>
        {cl.createdBy} · {cl.createdAt}
      </p>
      <div className="progress">
        <i style={{ width: `${st.pct}%` }} />
      </div>
      <div className="cl-card-foot">
        <span>
          完成 {st.done}/{st.total} · 缺陷 {st.defects}
        </span>
        {cl.status === "draft" && (
          <button
            className="link-danger"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("确定删除该草稿检查单？此操作不可恢复。")) onDelete(cl.id);
            }}
          >
            删除
          </button>
        )}
      </div>
    </article>
  );
}

function ItemCard({
  item,
  editable,
  onChange,
}: {
  item: CheckItem;
  editable: boolean;
  onChange: (item: CheckItem) => void;
}) {
  return (
    <article className={`item-card${item.result ? ` r-${item.result}` : ""}`}>
      <div className="item-row">
        <span className="item-title">{item.title}</span>
        <div className="result-buttons">
          {(Object.keys(RESULT_LABELS) as ItemResult[]).map((r) => (
            <button
              key={r}
              type="button"
              disabled={!editable}
              className={`rb rb-${r}${item.result === r ? " on" : ""}`}
              onClick={() => onChange({ ...item, result: r })}
            >
              {RESULT_LABELS[r]}
            </button>
          ))}
        </div>
      </div>
      {item.result === "defect" && (
        <div className="defect-fields">
          <label>
            <span>缺陷描述 *</span>
            <textarea
              rows={2}
              disabled={!editable}
              value={item.defectDesc}
              placeholder="描述缺陷现象、位置、程度"
              onChange={(e) => onChange({ ...item, defectDesc: e.target.value })}
            />
          </label>
          <label>
            <span>处理意见 *</span>
            <textarea
              rows={2}
              disabled={!editable}
              value={item.action}
              placeholder="拟采取的处理措施 / 保留依据"
              onChange={(e) => onChange({ ...item, action: e.target.value })}
            />
          </label>
        </div>
      )}
      {item.result === "watch" && (
        <div className="defect-fields">
          <label>
            <span>观察备注</span>
            <input
              disabled={!editable}
              value={item.defectDesc}
              placeholder="可填写需持续关注的情况"
              onChange={(e) => onChange({ ...item, defectDesc: e.target.value })}
            />
          </label>
        </div>
      )}
    </article>
  );
}

function AtaSummary({ cl }: { cl: Checklist }) {
  const rows = ATA_TEMPLATE.map((chapter) => {
    const items = cl.items.filter((i) => i.ata === chapter.ata);
    const done = items.filter((i) => i.result !== null).length;
    const defects = items.filter((i) => i.result === "defect").length;
    const pending = cl.status === "submitted" ? done : 0;
    return { ata: chapter.ata, name: chapter.name, total: items.length, done, defects, pending };
  });
  return (
    <section className="ata-summary">
      <h3>按 ATA 汇总</h3>
      <table>
        <thead>
          <tr>
            <th>ATA 章节</th>
            <th>完成量</th>
            <th>缺陷项</th>
            <th>待复核</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ata}>
              <td>
                {r.ata} {r.name}
              </td>
              <td>
                {r.done}/{r.total}
              </td>
              <td className={r.defects > 0 ? "cell-danger" : ""}>{r.defects}</td>
              <td>{r.pending}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ReviewPanel({
  onRelease,
  onReject,
}: {
  onRelease: (sign: string) => void;
  onReject: (reason: string) => void;
}) {
  const [sign, setSign] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <section className="sign-area">
      <h3>放行复核</h3>
      <label>
        <span>放行人员签署（签发放行时必填）</span>
        <input value={sign} onChange={(e) => setSign(e.target.value)} placeholder="放行人员姓名/执照号" />
      </label>
      <label>
        <span>退回原因（退回整改时必填）</span>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="说明需整改的项目与原因，退回后检查员可继续修改"
        />
      </label>
      {msg && <p className="error-text">{msg}</p>}
      <div className="review-actions">
        <button
          className="danger-action"
          onClick={() => {
            if (!reason.trim()) {
              setMsg("退回整改时必须填写退回原因");
              return;
            }
            onReject(reason.trim());
          }}
        >
          退回整改
        </button>
        <button
          className="primary-action"
          onClick={() => {
            if (!sign.trim()) {
              setMsg("签发放行前请填写放行人员签署");
              return;
            }
            onRelease(sign.trim());
          }}
        >
          签发放行
        </button>
      </div>
    </section>
  );
}

function App() {
  const [checklists, setChecklists] = useState<Checklist[]>(loadChecklists);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(() => {
    const saved = localStorage.getItem(ROLE_KEY);
    return saved === "reviewer" ? "reviewer" : "engineer";
  });
  const [showNew, setShowNew] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // 填写内容自动保存到本机浏览器
  useEffect(() => {
    saveChecklists(checklists);
  }, [checklists]);

  useEffect(() => {
    localStorage.setItem(ROLE_KEY, role);
  }, [role]);

  const active = useMemo(
    () => checklists.find((c) => c.id === activeId) ?? checklists[0] ?? null,
    [checklists, activeId]
  );

  const metrics = useMemo(() => {
    const allItems = checklists.flatMap((c) => c.items);
    const done = allItems.filter((i) => i.result !== null).length;
    const defects = allItems.filter((i) => i.result === "defect").length;
    const pending = checklists.filter((c) => c.status === "submitted").length;
    const pct = allItems.length === 0 ? 0 : Math.round((done / allItems.length) * 100);
    return { total: checklists.length, pct, defects, pending };
  }, [checklists]);

  function updateActive(fn: (cl: Checklist) => Checklist) {
    if (!active) return;
    setChecklists((list) => list.map((c) => (c.id === active.id ? fn(c) : c)));
  }

  function createChecklist(aircraftType: string, regNo: string, createdBy: string) {
    const cl: Checklist = {
      id: uid(),
      aircraftType,
      regNo,
      createdBy,
      createdAt: now(),
      status: "draft",
      items: buildItems(),
      inspectorSign: createdBy,
      submittedAt: null,
      returnReason: "",
      reviewerSign: "",
      releasedAt: null,
    };
    setChecklists((list) => [cl, ...list]);
    setActiveId(cl.id);
    setShowNew(false);
    setErrors([]);
  }

  function submitForReview() {
    if (!active) return;
    const errs = validateForSubmit(active);
    setErrors(errs);
    if (errs.length > 0) return;
    updateActive((cl) => ({ ...cl, status: "submitted", submittedAt: now(), returnReason: "" }));
  }

  const editable = !!active && role === "engineer" && (active.status === "draft" || active.status === "returned");

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">hxwl-07 · 班前检查工作台</p>
          <h1>航空维修检查清单</h1>
          <p className="subtitle">
            按机型建立检查单，在 ATA 章节下逐项记录正常 / 观察 / 缺陷；缺陷项需填写缺陷描述与处理意见。
            签署齐全后方可提交，由放行人员复核：退回可修改后重新提交，签发放行后内容锁定。填写内容自动保存在本机浏览器。
          </p>
        </div>
        <div className="stack-card">
          <span>当前角色</span>
          <div className="role-switch">
            <button className={role === "engineer" ? "active" : ""} onClick={() => setRole("engineer")}>
              维修工程师
            </button>
            <button className={role === "reviewer" ? "active" : ""} onClick={() => setRole("reviewer")}>
              放行人员
            </button>
          </div>
          <span className="role-hint">
            {role === "engineer" ? "填写检查项、签署并提交复核" : "复核待审检查单，退回整改或签发放行"}
          </span>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="检查单" value={String(metrics.total)} index={0} />
        <MetricCard label="完成率" value={`${metrics.pct}%`} index={1} />
        <MetricCard label="缺陷项" value={String(metrics.defects)} index={2} />
        <MetricCard label="待复核" value={String(metrics.pending)} index={3} />
      </section>

      <section className="workspace">
        <aside className="panel narrow">
          <div className="side-head">
            <h2>检查单</h2>
            <button className="primary-action" onClick={() => setShowNew((v) => !v)}>
              {showNew ? "收起" : "新建"}
            </button>
          </div>
          {showNew && <NewChecklistForm onCreate={createChecklist} onCancel={() => setShowNew(false)} />}
          <div className="cl-list">
            {checklists.length === 0 && <p className="empty">暂无检查单，点击“新建”开始。</p>}
            {checklists.map((cl) => (
              <ChecklistCard
                key={cl.id}
                cl={cl}
                active={active?.id === cl.id}
                onSelect={() => {
                  setActiveId(cl.id);
                  setErrors([]);
                }}
                onDelete={(id) => setChecklists((list) => list.filter((c) => c.id !== id))}
              />
            ))}
          </div>
        </aside>

        <section className="panel detail-panel">
          {!active && <p className="empty">请选择左侧检查单，或新建一份按机型的检查单。</p>}
          {active && (
            <>
              <div className="detail-head">
                <div>
                  <p className="eyebrow">
                    {active.aircraftType}
                    {active.regNo ? ` · ${active.regNo}` : ""}
                  </p>
                  <h2>
                    检查单 <StatusBadge status={active.status} />
                  </h2>
                  <p className="meta">
                    创建：{active.createdBy} · {active.createdAt}
                    {active.submittedAt && <> · 提交：{active.submittedAt}</>}
                    {active.releasedAt && (
                      <>
                        {" "}
                        · 放行：{active.reviewerSign} · {active.releasedAt}
                      </>
                    )}
                  </p>
                </div>
                <div className="pct-box">
                  <strong>{statsOf(active).pct}%</strong>
                  <span>
                    完成 {statsOf(active).done}/{statsOf(active).total}
                  </span>
                </div>
              </div>

              {active.status === "returned" && active.returnReason && (
                <div className="banner warn">放行人员退回：{active.returnReason}（修改后可重新提交复核）</div>
              )}
              {active.status === "submitted" && (
                <div className="banner info">
                  {role === "reviewer" ? "该检查单待复核，请在页面底部执行退回或签发放行。" : "已提交，等待放行人员复核，内容暂不可修改。"}
                </div>
              )}
              {active.status === "released" && (
                <div className="banner ok">
                  已签发放行，内容已锁定。放行签署：{active.reviewerSign} · {active.releasedAt}
                </div>
              )}

              <AtaSummary cl={active} />

              {ATA_TEMPLATE.map((chapter) => {
                const items = active.items.filter((i) => i.ata === chapter.ata);
                const done = items.filter((i) => i.result !== null).length;
                const defects = items.filter((i) => i.result === "defect").length;
                const watch = items.filter((i) => i.result === "watch").length;
                return (
                  <section key={chapter.ata} className="ata-section">
                    <header>
                      <h3>
                        {chapter.ata} {chapter.name}
                      </h3>
                      <div className="ata-chips">
                        <span>
                          完成 {done}/{items.length}
                        </span>
                        {defects > 0 && <span className="chip-danger">缺陷 {defects}</span>}
                        {watch > 0 && <span className="chip-warn">观察 {watch}</span>}
                        {active.status === "submitted" && done > 0 && <span className="chip-info">待复核 {done}</span>}
                      </div>
                    </header>
                    {items.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        editable={editable}
                        onChange={(next) => {
                          setErrors([]);
                          updateActive((cl) => ({
                            ...cl,
                            items: cl.items.map((i) => (i.id === next.id ? next : i)),
                          }));
                        }}
                      />
                    ))}
                  </section>
                );
              })}

              {editable && (
                <section className="sign-area">
                  <label>
                    <span>维修工程师签署 *</span>
                    <input
                      value={active.inspectorSign}
                      placeholder="签署人姓名/执照号"
                      onChange={(e) => updateActive((cl) => ({ ...cl, inspectorSign: e.target.value }))}
                    />
                  </label>
                  <button className="primary-action big" onClick={submitForReview}>
                    提交复核
                  </button>
                  {errors.length > 0 && (
                    <ul className="error-list">
                      {errors.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {active.status === "submitted" && role === "reviewer" && (
                <ReviewPanel
                  onRelease={(sign) =>
                    updateActive((cl) => ({ ...cl, status: "released", reviewerSign: sign, releasedAt: now() }))
                  }
                  onReject={(reason) => updateActive((cl) => ({ ...cl, status: "returned", returnReason: reason }))}
                />
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
