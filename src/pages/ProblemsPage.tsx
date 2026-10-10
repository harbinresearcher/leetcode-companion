import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { deleteProblem, getAllProblems } from '../db';
import {
  applyImport,
  buildBackup,
  downloadBackup,
  parseBackup,
  type ImportMode,
  type ParsedBackup,
} from '../backup';
import { PATTERNS, getPatternName } from '../patterns';
import Analysis from '../components/Analysis';
import { logger } from '../logger';

function ImportPreview({
  parsed,
  existingIds,
  busy,
  error,
  onConfirm,
  onClose,
  returnFocus,
}: {
  parsed: ParsedBackup;
  existingIds: Set<string>;
  busy: boolean;
  error: string;
  onConfirm: (mode: ImportMode) => void;
  onClose: () => void;
  returnFocus: HTMLButtonElement | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<ImportMode>('skip');
  const conflicts = parsed.valid.filter((p) => existingIds.has(p.id)).length;
  const ignored = parsed.invalidCount + parsed.duplicateInFileCount;
  useEffect(() => {
    /*
     * ========================================================================
     * 步骤1：保护导入预览的键盘焦点
     * ========================================================================
     * 数据源：原生 dialog 与导入按钮
     * 操作：1) 模态打开并约束焦点 2) 关闭后恢复入口
     */
    logger.info('开始打开备份预览');
    // 1.1 原生模态阻止背景导航与焦点越界
    const element = dialog.current;
    element?.showModal();
    logger.info('备份预览打开完成');
    return () => {
      // 1.2 卸载时关闭窗口并恢复触发按钮
      element?.close();
      returnFocus?.focus();
    };
  }, [returnFocus]);
  return (
    <dialog
      ref={dialog}
      className="backup-dialog"
      aria-labelledby="backup-title"
      aria-describedby="backup-summary"
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id="backup-title">导入预览</h2>
        <button className="icon-button" aria-label="关闭导入预览" disabled={busy} onClick={onClose}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p id="backup-summary" className="dialog-description">
        备份中有 {parsed.valid.length} 道题。其中 {parsed.valid.length - conflicts} 道是新的，
        {conflicts} 道已存在。
      </p>
      {ignored > 0 && <p className="muted text-sm">将忽略 {ignored} 条无效数据。</p>}
      {conflicts > 0 ? (
        <fieldset className="import-options" disabled={busy}>
          <legend>已存在题目的处理方式</legend>
          <label className={`import-option ${mode === 'skip' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="import-mode"
              value="skip"
              checked={mode === 'skip'}
              onChange={() => setMode('skip')}
            />
            <span>跳过已存在的（只新增）</span>
          </label>
          <label className={`import-option ${mode === 'overwrite' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="import-mode"
              value="overwrite"
              checked={mode === 'overwrite'}
              onChange={() => setMode('overwrite')}
            />
            <span>覆盖已存在的（还原为备份版本）</span>
          </label>
          <p className="notice">覆盖会把已存在题目的复习进度替换为备份里的版本，且无法撤销。</p>
        </fieldset>
      ) : (
        <p className="notice">只会新增题目，不会修改已有题目。</p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {busy && (
        <p className="muted text-sm" role="status">
          正在导入备份，请保持页面打开。
        </p>
      )}
      <div className="dialog-actions">
        <button className="secondary" autoFocus disabled={busy} onClick={onClose}>
          取消
        </button>
        <button
          className="primary"
          aria-busy={busy}
          disabled={busy || parsed.valid.length === 0}
          onClick={() => onConfirm(mode)}
        >
          {busy ? '正在导入…' : '开始导入'}
        </button>
      </div>
    </dialog>
  );
}

export default function ProblemsPage({ goImport }: { goImport: () => void }) {
  const problems = useLiveQuery(getAllProblems, []);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [preview, setPreview] = useState<{ parsed: ParsedBackup; existingIds: Set<string> } | null>(
    null,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const importButton = useRef<HTMLButtonElement>(null);
  const locked = useRef(false);
  const filtered = problems?.filter(
    (p) =>
      filter === 'all' || p.primaryPatternId === filter || p.secondaryPatternIds.includes(filter),
  );
  const unavailable = !problems || busy || reading || !!deleting;

  function exportBackup() {
    if (!problems || locked.current) return;
    /*
     * ========================================================================
     * 步骤1：导出完整题库
     * ========================================================================
     * 数据源：未筛选的题库
     * 操作：1) 白名单导出 2) 下载触发成功后提示
     */
    logger.info('开始导出题库备份');
    // 1.1 同步锁阻止操作重入，筛选不影响备份
    locked.current = true;
    setError('');
    setMessage('');
    try {
      downloadBackup(buildBackup(problems));
      setMessage(`已导出 ${problems.length} 道题`);
    } catch {
      setError('导出失败，请检查浏览器下载权限后重试。');
    } finally {
      // 1.2 只确认下载已触发，不承诺磁盘写入
      locked.current = false;
      logger.info('题库备份导出处理完成');
    }
  }

  async function readBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || locked.current) return;
    /*
     * ========================================================================
     * 步骤1：读取备份并准备只读预览
     * ========================================================================
     * 数据源：用户选择的 JSON 文件与本地 ID
     * 操作：1) 校验内容 2) 确认前不写库
     */
    logger.info('开始读取备份文件');
    // 1.1 重置输入，同一文件可以再次选择
    locked.current = true;
    setReading(true);
    setError('');
    setMessage('');
    try {
      const parsed = parseBackup(await file.text());
      const current = await getAllProblems();
      // 1.2 不信任后缀或 MIME，写入留到确认
      setPreview({ parsed, existingIds: new Set(current.map((p) => p.id)) });
    } catch (e) {
      setError(e instanceof Error ? e.message : '无法读取备份文件，请重新选择。');
    } finally {
      locked.current = false;
      setReading(false);
      logger.info('备份文件读取处理完成');
    }
  }

  async function restoreBackup(mode: ImportMode) {
    if (!preview || locked.current) return;
    /*
     * ========================================================================
     * 步骤1：确认并恢复题库备份
     * ========================================================================
     * 数据源：已校验题目与冲突策略
     * 操作：1) 单事务写库 2) 显示实际结果
     */
    logger.info('开始恢复题库备份');
    // 1.1 同步锁与禁用控件阻止重复确认
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await applyImport(preview.parsed.valid, preview.existingIds, mode);
      const ignored = preview.parsed.invalidCount + preview.parsed.duplicateInFileCount;
      // 1.2 只用事务真实计数，不重新安排复习
      setMessage(
        `新增 ${result.added} 题，覆盖 ${result.overwritten} 题，跳过 ${result.skipped} 题${ignored > 0 ? `，忽略 ${ignored} 条无效数据` : ''}`,
      );
      setPreview(null);
    } catch {
      setError('导入失败，题库未发生改动。请检查浏览器存储后重试。');
    } finally {
      locked.current = false;
      setBusy(false);
      logger.info('题库备份恢复处理完成');
    }
  }

  async function remove(id: string) {
    if (locked.current || !window.confirm('删除这道题和复习记录？此操作无法撤销。')) return;
    /*
     * ========================================================================
     * 步骤1：处理题库删除
     * ========================================================================
     * 数据源：选定题目
     * 操作：1) 用户确认 2) 等待数据库成功
     */
    logger.info('开始处理题库删除');
    // 1.1 与备份共享锁，失败保留题目
    locked.current = true;
    setDeleting(id);
    setError('');
    setMessage('');
    try {
      await deleteProblem(id);
    } catch {
      setError('删除失败，请检查浏览器存储后重试。');
    } finally {
      locked.current = false;
      setDeleting(null);
      logger.info('题库删除处理完成');
    }
  }

  return (
    <div className="library-layout">
      <div className="page-heading page-heading-with-action">
        <div>
          <h1>题库</h1>
          <p className="muted">按解题模式整理，保留每次复习的进度。</p>
        </div>
        <button className="primary" disabled={busy || reading} onClick={goImport}>
          + 导入题目
        </button>
      </div>
      <section className="backup-bar" aria-label="题库备份">
        <div className="backup-copy">
          <h2>题库备份</h2>
          <p className="muted">备份包含题库与复习进度，不包含 API Key。</p>
        </div>
        <div className="backup-actions">
          <button className="secondary" disabled={unavailable} onClick={exportBackup}>
            导出备份
          </button>
          <button
            className="secondary"
            ref={importButton}
            disabled={unavailable}
            onClick={() => fileInput.current?.click()}
          >
            导入备份
          </button>
          <input
            ref={fileInput}
            type="file"
            name="backup-file"
            accept="application/json"
            aria-label="选择备份文件"
            className="sr-only"
            tabIndex={-1}
            onChange={readBackup}
          />
        </div>
      </section>
      {reading && (
        <p className="muted text-sm" role="status">
          正在读取备份文件…
        </p>
      )}
      {message && (
        <p className="success feedback" role="status">
          {message}
        </p>
      )}
      {error && !preview && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="filter-bar">
        <span className="muted text-sm">
          共 {problems?.length ?? '…'} 题 · 当前 {filtered?.length ?? '…'} 题
        </span>
        <label className="filter-label">
          筛选模式
          <select value={filter} disabled={busy} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">全部模式</option>
            {PATTERNS.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!problems && (
        <p className="muted" role="status">
          正在读取题库…
        </p>
      )}
      {filtered?.length === 0 && (
        <div className="empty panel">
          <h2>{problems?.length === 0 ? '题库还是空的' : '这个模式还没有题目'}</h2>
          <p className="muted">
            {problems?.length === 0
              ? '导入一道题开始学习，或从备份恢复已有题库。'
              : '选择其他模式，或导入一道相关题目。'}
          </p>
          <button className="secondary" disabled={busy || reading} onClick={goImport}>
            导入题目
          </button>
        </div>
      )}
      {filtered && filtered.length > 0 && (
        <div className="problem-list">
          {filtered.map((p) => (
            <article className="problem-card" key={p.id}>
              <div className="problem-heading">
                <div className="problem-identity">
                  <h2>{p.title}</h2>
                  <span className={`difficulty ${p.difficulty}`}>
                    {{ easy: '简单', medium: '中等', hard: '困难' }[p.difficulty]}
                  </span>
                </div>
                <button
                  className="delete-button"
                  disabled={unavailable}
                  onClick={() => remove(p.id)}
                  aria-label={`删除 ${p.title}`}
                >
                  {deleting === p.id ? '删除中…' : '删除'}
                </button>
              </div>
              <div className="problem-patterns">
                <span className="badge accent">{getPatternName(p.primaryPatternId)}</span>
                {p.secondaryPatternIds.map((id) => (
                  <span className="badge" key={id}>
                    {getPatternName(id)}
                  </span>
                ))}
                {p.aiAnalysis.warnings.length > 0 && <span className="badge">分析待确认</span>}
              </div>
              <p className="problem-insight">{p.aiAnalysis.coreInsight}</p>
              <div className="problem-meta">
                <span>
                  下次复习 ·{' '}
                  {p.fsrsCard.due.toLocaleString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {p.url && /^https?:\/\//i.test(p.url) && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1"
                  >
                    打开原题{' '}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M7 17 17 7M7 7h10v10" />
                    </svg>
                  </a>
                )}
              </div>
              <details className="problem-details">
                <summary>题干与分析</summary>
                <p className="description my-5">{p.description}</p>
                <Analysis problem={p} />
              </details>
            </article>
          ))}
        </div>
      )}
      {preview && (
        <ImportPreview
          parsed={preview.parsed}
          existingIds={preview.existingIds}
          busy={busy}
          error={error}
          onConfirm={restoreBackup}
          onClose={() => {
            if (!locked.current) {
              setPreview(null);
              setError('');
            }
          }}
          returnFocus={importButton.current}
        />
      )}
    </div>
  );
}
