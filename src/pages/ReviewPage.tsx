import { useEffect, useRef, useState } from 'react';
import { getDueProblems, saveReview } from '../db';
import { Rating, type Grade } from '../fsrs';
import type { Problem } from '../types';
import Analysis from '../components/Analysis';
import { logger } from '../logger';

const ratings: { rating: Grade; label: string; hint: string; className: string }[] = [
  { rating: Rating.Again, label: '忘了', hint: '需要重学', className: 'again' },
  { rating: Rating.Hard, label: '困难', hint: '费力回忆', className: 'hard' },
  { rating: Rating.Good, label: '记住了', hint: '独立完成', className: 'good' },
  { rating: Rating.Easy, label: '轻松', hint: '熟练掌握', className: 'easy' },
];
export default function ReviewPage({ goImport }: { goImport: () => void }) {
  const [queue, setQueue] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(0);
  const locked = useRef(false);
  const current = queue[0];

  async function loadQueue() {
    /*
     * ========================================================================
     * 步骤1：建立本轮复习快照
     * ========================================================================
     * 数据源：到期卡片；操作：1) 按 Date 查询 2) 固定本轮队列
     */
    logger.info('开始加载复习队列');
    // 1.1 加载失败保留错误，允许重试
    setLoading(true);
    setError('');
    try {
      const due = await getDueProblems();
      setQueue(due);
      setRevealed(false);
      setCompleted(0);
      logger.info('复习队列加载完成');
    } catch {
      setError('读取复习队列失败，请检查浏览器存储并重试。');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void loadQueue();
  }, []);

  async function rate(rating: Grade) {
    if (!current || locked.current || !revealed) return;
    /*
     * ========================================================================
     * 步骤1：记录回忆表现并推进队列
     * ========================================================================
     * 数据源：当前题目快照与评分；操作：1) 原子持久化 2) 成功后切题
     */
    logger.info('开始处理回忆评分');
    // 1.1 同步锁和数据库快照校验共同防止重复评分
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await saveReview(current, rating);
      // 1.2 不因 Again 分钟到期在当前会话立即重新插入
      setQueue((previous) => previous.slice(1));
      setRevealed(false);
      setCompleted((c) => c + 1);
      logger.info('回忆评分处理完成');
    } catch (e) {
      setError(e instanceof Error ? e.message : '评分保存失败，请重试。');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="review-layout space-y-6">
      <div className="page-heading">
        <p className="eyebrow">先回忆，再看答案</p>
        <h1>
          让解法留在脑海里<span className="gold">.</span>
        </h1>
        <p className="muted">试着独立推导，按实际回忆表现评分。</p>
      </div>
      {error && (
        <div className="error" role="alert">
          <p>{error}</p>
          <button className="text-button" onClick={loadQueue} disabled={busy}>
            重新加载队列
          </button>
        </div>
      )}
      {loading ? (
        <p className="muted" role="status">
          正在读取到期题目…
        </p>
      ) : !current ? (
        <section className="panel empty">
          <span className="empty-mark">✓</span>
          <h2>{completed ? '本轮复习完成' : '目前没有到期题目'}</h2>
          <p className="muted">
            {completed
              ? `已复习 ${completed} 题，下次时间已按回忆表现更新。`
              : '新导入的题目会立即进入复习队列。'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button className="secondary" onClick={loadQueue}>
              重新加载队列
            </button>
            <button className="primary" onClick={goImport}>
              导入题目 →
            </button>
          </div>
          <p className="muted text-xs">选择“忘了”后，题目可能在几分钟后再次到期。</p>
        </section>
      ) : (
        <>
          <div className="review-progress">
            <span>本轮已复习 {completed} 题</span>
            <span className="mono">剩余 {queue.length} 题</span>
          </div>
          <article className="panel review-problem">
            <div className="flex flex-wrap justify-between gap-3 mb-6">
              <span className="eyebrow">独立尝试</span>
              {current.url && /^https?:\/\//i.test(current.url) && (
                <a href={current.url} target="_blank" rel="noreferrer" className="text-sm">
                  打开原题 ↗
                </a>
              )}
            </div>
            <h2 className="text-2xl mb-5">{current.title}</h2>
            <p className="description">{current.description}</p>
          </article>
          {!revealed ? (
            <div className="recall-box">
              <p className="muted text-sm">先想清楚：关键条件是什么？用什么结构？为什么成立？</p>
              <button className="primary" onClick={() => setRevealed(true)}>
                显示答案与洞察 →
              </button>
            </div>
          ) : (
            <>
              <section className="panel">
                <Analysis problem={current} />
              </section>
              <div>
                <p className="section-label">这次回忆得怎么样？</p>
                <div className="rating-grid">
                  {ratings.map((r) => (
                    <button
                      key={r.rating}
                      className={`rating ${r.className}`}
                      disabled={busy}
                      onClick={() => rate(r.rating)}
                    >
                      <strong>{r.label}</strong>
                      <span>{r.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
