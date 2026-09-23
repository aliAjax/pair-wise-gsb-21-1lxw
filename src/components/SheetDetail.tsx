import { useState } from "react";
import type { ItemStatus, Role, Sheet } from "../types";
import { ATA_TEMPLATE, TOTAL_ITEMS } from "../checklist";
import {
  STATUS_LABEL,
  chapterProgress,
  fmtTime,
  sheetProgress,
  validateSheet,
} from "../utils";

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "ok", label: "正常" },
  { value: "observe", label: "观察" },
  { value: "defect", label: "缺陷" },
];

interface Props {
  sheet: Sheet;
  role: Role;
  onBack: () => void;
  onUpdate: (updater: (s: Sheet) => Sheet) => void;
}

export default function SheetDetail({ sheet, role, onBack, onUpdate }: Props) {
  const editable = sheet.status === "draft" || sheet.status === "returned";
  const [errors, setErrors] = useState<string[]>([]);
  const [reviewerName, setReviewerName] = useState(sheet.reviewer);
  const [returnReason, setReturnReason] = useState("");
  const [showReturnBox, setShowReturnBox] = useState(false);

  const progress = sheetProgress(sheet);

  const patchItem = (itemId: string, patch: Partial<Sheet["items"][string]>) => {
    onUpdate((s) => ({
      ...s,
      items: { ...s.items, [itemId]: { ...s.items[itemId], ...patch } },
    }));
  };

  const submit = () => {
    const errs = validateSheet(sheet);
    setErrors(errs);
    if (errs.length > 0) return;
    onUpdate((s) => ({
      ...s,
      status: "submitted",
      submittedAt: Date.now(),
      returnReason: "",
    }));
  };

  const release = () => {
    if (!reviewerName.trim()) return;
    onUpdate((s) => ({
      ...s,
      status: "released",
      reviewer: reviewerName.trim(),
      releasedAt: Date.now(),
    }));
  };

  const sendBack = () => {
    if (!returnReason.trim()) return;
    onUpdate((s) => ({ ...s, status: "returned", returnReason: returnReason.trim() }));
    setShowReturnBox(false);
    setReturnReason("");
  };

  return (
    <>
      <section className="panel sheet-head">
        <div className="section-heading">
          <div>
            <p>检查单 {sheet.id}</p>
            <h2>
              {sheet.aircraftType} · {sheet.registration}
              <span className={`badge badge-${sheet.status}`}>{STATUS_LABEL[sheet.status]}</span>
            </h2>
            <p className="meta-line">
              完成 {progress.done}/{TOTAL_ITEMS} · 缺陷 {progress.defects} · 创建于{" "}
              {fmtTime(sheet.createdAt)} · 更改已自动保存到本机浏览器（
              {fmtTime(sheet.updatedAt)}）
            </p>
          </div>
          <button onClick={onBack}>返回工作台</button>
        </div>

        {sheet.status === "returned" && sheet.returnReason && (
          <div className="banner banner-return">
            已退回，请修改后重新提交。退回原因：{sheet.returnReason}
          </div>
        )}
        {sheet.status === "submitted" && (
          <div className="banner banner-info">
            已提交复核（{fmtTime(sheet.submittedAt)}），等待放行人员处理。提交后内容不可修改。
          </div>
        )}
        {sheet.status === "released" && (
          <div className="banner banner-release">
            已由 {sheet.reviewer} 签发放行（{fmtTime(sheet.releasedAt)}），内容已固定，不可再修改。
          </div>
        )}
      </section>

      {ATA_TEMPLATE.map((ch) => {
        const cp = chapterProgress(sheet, ch.ata);
        return (
          <section key={ch.ata} className="panel">
            <div className="section-heading">
              <div>
                <p>{ch.ata}</p>
                <h2>
                  {ch.name}
                  <span className="chapter-progress">
                    {cp.done}/{ch.items.length}
                  </span>
                  {cp.defects > 0 && <span className="badge badge-defect">缺陷 {cp.defects}</span>}
                </h2>
              </div>
            </div>
            <div className="item-list">
              {ch.items.map((it) => {
                const rec = sheet.items[it.id];
                return (
                  <div key={it.id} className={`item-row item-${rec.status ?? "none"}`}>
                    <div className="item-head">
                      <span className="item-title">{it.title}</span>
                      <div className="seg">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            className={`seg-${opt.value} ${rec.status === opt.value ? "active" : ""}`}
                            disabled={!editable}
                            onClick={() => patchItem(it.id, { status: opt.value })}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {rec.status === "defect" && (
                      <div className="defect-fields">
                        <label>
                          <span>缺陷描述 *</span>
                          <textarea
                            rows={2}
                            placeholder="描述缺陷现象、位置、程度"
                            value={rec.defectDescription}
                            disabled={!editable}
                            onChange={(e) => patchItem(it.id, { defectDescription: e.target.value })}
                          />
                        </label>
                        <label>
                          <span>处理意见 *</span>
                          <textarea
                            rows={2}
                            placeholder="如：按 AMM 32-XX 更换、保留故障并监控"
                            value={rec.disposition}
                            disabled={!editable}
                            onChange={(e) => patchItem(it.id, { disposition: e.target.value })}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>签署与提交</p>
            <h2>检查签署</h2>
          </div>
        </div>
        <div className="sign-row">
          <label>
            <span>签署人 *</span>
            <input
              value={sheet.inspector}
              placeholder="检查人员姓名 / 工号"
              disabled={!editable}
              onChange={(e) => onUpdate((s) => ({ ...s, inspector: e.target.value }))}
            />
          </label>
          {editable && (
            <button className="primary-action" onClick={submit}>
              {sheet.status === "returned" ? "修改完成，重新提交复核" : "提交复核"}
            </button>
          )}
        </div>
        {errors.length > 0 && (
          <div className="error-box">
            <strong>无法提交，请先完成以下 {errors.length} 项：</strong>
            <ul>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {sheet.status === "submitted" && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p>放行复核</p>
              <h2>放行人员处理</h2>
            </div>
          </div>
          {role !== "reviewer" ? (
            <p className="empty-hint">当前为维修工程师视角。切换到“放行人员”角色后可进行退回或签发放行。</p>
          ) : (
            <>
              <div className="sign-row">
                <label>
                  <span>放行人员 *</span>
                  <input
                    value={reviewerName}
                    placeholder="放行人员姓名 / 工号"
                    onChange={(e) => setReviewerName(e.target.value)}
                  />
                </label>
                <button
                  className="primary-action"
                  disabled={!reviewerName.trim()}
                  onClick={release}
                >
                  签发放行
                </button>
                <button className="danger-action" onClick={() => setShowReturnBox((v) => !v)}>
                  退回修改
                </button>
              </div>
              {showReturnBox && (
                <div className="return-box">
                  <label>
                    <span>退回原因 *</span>
                    <textarea
                      rows={2}
                      placeholder="写清需要补充或更正的内容"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                    />
                  </label>
                  <button
                    className="danger-action"
                    disabled={!returnReason.trim()}
                    onClick={sendBack}
                  >
                    确认退回
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}
