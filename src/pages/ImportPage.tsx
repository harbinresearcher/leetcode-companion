import { useRef, useState, type FormEvent } from 'react';
import { analyzeProblem, loadAIConfig } from '../ai';
import { resolveProblemSource } from '../source';
import { saveProblem } from '../db';
import { newCard } from '../fsrs';
import { PATTERNS } from '../patterns';
import { logger } from '../logger';
import type { Problem } from '../types';
import Analysis from '../components/Analysis';

export default function ImportPage({
  openSettings,
  configured,
  goLibrary,
}: {
  openSettings: () => void;
  configured: boolean;
  goLibrary: () => void;
}) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Problem | null>(null);
  const locked = useRef(false);
  const [notice, setNotice] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked.current) return;
    /*
     * ========================================================================
     * 步骤1：分析并保存手动导入题目
     * ========================================================================
     * 数据源：文本与可选链接；操作：1) 校验输入 2) 分析后持久化
     */
    logger.info('开始导入题目');
    // 1.1 同步锁防止同一渲染周期重复发起付费请求
    locked.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    setResult(null);
    try {
      const cleanUrl = url.trim();
      const description = await resolveProblemSource(text, cleanUrl);
      const data = await analyzeProblem(description, loadAIConfig());
      const now = Date.now();
      // 1.2 题干、分析和新卡片一次保存，成功后才清空输入
      const problem: Problem = {
        id: crypto.randomUUID(),
        title: data.title,
        description,
        url: cleanUrl,
        difficulty: data.difficulty,
        primaryPatternId: data.primaryPatternId,
        secondaryPatternIds: data.secondaryPatternIds,
        aiAnalysis: {
          coreInsight: data.coreInsight,
          skeleton: data.skeleton,
          prerequisites: data.prerequisites,
          warnings: data.warnings,
        },
        fsrsCard: newCard(new Date(now)),
        createdAt: now,
        updatedAt: now,
      };
      await saveProblem(problem);
      setResult(problem);
      setNotice(`导入成功：${problem.title}`);
      setText('');
      setUrl('');
      logger.info('题目导入完成');
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败，请重试。');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="import-grid">
      {(notice || error) && (
        <div
          className={`import-toast ${error ? 'import-toast-error' : ''}`}
          role={error ? 'alert' : 'status'}
        >
          <span>{error || notice}</span>
          <button
            type="button"
            aria-label="关闭导入提示"
            onClick={() => {
              setNotice('');
              setError('');
            }}
          >
            <svg
              width="16"
              height="16"
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
      )}
      <div className="space-y-6">
        <div className="page-heading">
          <h1>导入题目</h1>
          <p className="muted">粘贴题干或原题链接，提炼解题模式并加入复习。</p>
        </div>
        <form className="panel space-y-5" onSubmit={submit}>
          <div className="panel-heading">
            <h2>题目内容</h2>
            <span className="muted text-xs">支持题干与公开链接</span>
          </div>
          <label className="field">
            原题链接 <span className="muted font-normal">与描述二选一</span>
            <input
              type="url"
              name="problem-url"
              spellCheck={false}
              autoComplete="off"
              value={url}
              disabled={busy}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://leetcode.cn/problems/…"
            />
          </label>
          <label className="field">
            题目描述
            <textarea
              aria-label="题目描述"
              name="problem-description"
              rows={11}
              value={text}
              disabled={busy}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                '粘贴完整题目描述，包括示例与约束。\n\n例如：给定一个整数数组 nums 和目标值 target，找出和为 target 的两个数，返回它们的下标。'
              }
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="muted text-xs">链接自动读取；也可只粘贴完整题干</span>
            <span className="mono muted text-xs">{text.length} 字符</span>
          </div>
          {!configured && (
            <div className="notice flex items-center justify-between gap-3">
              <span>先连接模型，开始分析题目。</span>
              <button type="button" className="text-button" onClick={openSettings}>
                配置 AI
              </button>
            </div>
          )}
          <button
            type="submit"
            className="primary w-full"
            disabled={busy || (!text.trim() && !url.trim()) || !configured}
          >
            {busy ? '正在分析并保存…' : '导入并解析'}
          </button>
          <p className="muted text-xs text-center" aria-live="polite">
            {busy
              ? '正在读取并分析题目，请保持页面打开。'
              : '链接交给 Jina Reader 读取，题干发送到你配置的 AI 服务；题库保存在本地。'}
          </p>
        </form>
        {result && (
          <section className="panel result" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2>{result.title}</h2>
                <p className="success text-xs mt-2">已保存到题库</p>
              </div>
              <button className="secondary" onClick={goLibrary}>
                查看题库
              </button>
            </div>
            <Analysis problem={result} />
          </section>
        )}
      </div>
      <aside className="space-y-6 import-aside">
        <section className="panel path-panel">
          <h2>导入后如何学习</h2>
          <ol className="learning-path">
            <li>
              <span>01</span>
              <div>
                <strong>识别模式</strong>
                <p>从题目中提炼关键条件与解法。</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>独立回忆</strong>
                <p>先自己推导，再展开洞察与骨架。</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>间隔复习</strong>
                <p>按真实回忆表现，安排下次相遇。</p>
              </div>
            </li>
          </ol>
          <p className="path-note">题目和复习进度保存在此浏览器，可在题库导出备份。</p>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>核心模式</h2>
            <span className="muted text-xs">16 种</span>
          </div>
          <div className="pattern-grid">
            {PATTERNS.map((p) => (
              <span key={p.id} title={p.description}>
                {p.name}
              </span>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
