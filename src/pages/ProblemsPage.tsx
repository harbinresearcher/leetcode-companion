import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { deleteProblem, getAllProblems } from '../db';
import { PATTERNS, getPatternName } from '../patterns';
import Analysis from '../components/Analysis';
import { logger } from '../logger';

export default function ProblemsPage({ goImport }: { goImport: () => void }) {
  const problems = useLiveQuery(getAllProblems, []);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const filtered = problems?.filter(
    (p) =>
      filter === 'all' || p.primaryPatternId === filter || p.secondaryPatternIds.includes(filter),
  );

  async function remove(id: string) {
    if (deleting || !window.confirm('删除这道题和复习记录？此操作无法撤销。')) return;
    /*
     * ========================================================================
     * 步骤1：处理题库删除
     * ========================================================================
     * 数据源：选定题目；操作：1) 用户确认 2) 等待数据库成功
     */
    logger.info('开始处理题库删除');
    // 1.1 失败保留题目并提示原因
    setDeleting(id);
    setError('');
    try {
      await deleteProblem(id);
      logger.info('题库删除处理完成');
    } catch {
      setError('删除失败，请检查浏览器存储后重试。');
    } finally {
      setDeleting(null);
    }
  }
  return (
    <div className="space-y-6">
      <div className="page-heading flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">把题目，归入解法</p>
          <h1>
            你的模式题库<span className="gold">.</span>
          </h1>
          <p className="muted">按模式回看，比逐题重读更有方向。</p>
        </div>
        <button className="primary" onClick={goImport}>
          + 导入题目
        </button>
      </div>
      <div className="filter-bar">
        <span className="muted text-sm">
          共 {problems?.length ?? '…'} 题 · 当前 {filtered?.length ?? '…'} 题
        </span>
        <label className="flex items-center gap-3 text-sm">
          筛选模式
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">全部模式</option>
            {PATTERNS.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!problems && (
        <p className="muted" role="status">
          正在读取题库…
        </p>
      )}
      {filtered?.length === 0 && (
        <div className="empty panel">
          <span className="empty-mark">{'{ }'}</span>
          <h2>{problems?.length === 0 ? '从第一道题开始' : '这个模式还没有题目'}</h2>
          <p className="muted">
            {problems?.length === 0
              ? '导入题目后，模式与复习卡片会保存在这里。'
              : '选择其他模式，或导入一道相关题目。'}
          </p>
          <button className="secondary" onClick={goImport}>
            去导入 →
          </button>
        </div>
      )}
      <div className="space-y-4">
        {filtered?.map((p) => (
          <article className="panel problem-card" key={p.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2>{p.title}</h2>
                  <span className={`difficulty ${p.difficulty}`}>
                    {{ easy: '简单', medium: '中等', hard: '困难' }[p.difficulty]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="badge accent">{getPatternName(p.primaryPatternId)}</span>
                  {p.secondaryPatternIds.map((id) => (
                    <span className="badge" key={id}>
                      {getPatternName(id)}
                    </span>
                  ))}
                  {p.aiAnalysis.warnings.length > 0 && <span className="badge">分析待确认</span>}
                </div>
              </div>
              <button
                className="delete-button"
                disabled={!!deleting}
                onClick={() => remove(p.id)}
                aria-label={`删除 ${p.title}`}
              >
                {deleting === p.id ? '删除中…' : '删除'}
              </button>
            </div>
            <p className="muted leading-relaxed my-4">{p.aiAnalysis.coreInsight}</p>
            <div className="flex flex-wrap justify-between gap-2 text-xs muted">
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
                <a href={p.url} target="_blank" rel="noreferrer">
                  打开原题 ↗
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
    </div>
  );
}
