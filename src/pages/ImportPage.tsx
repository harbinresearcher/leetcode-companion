import { useRef, useState, type FormEvent } from 'react';
import { analyzeProblem, loadAIConfig } from '../ai';
import { saveProblem } from '../db';
import { newCard } from '../fsrs';
import { PATTERNS } from '../patterns';
import { logger } from '../logger';
import type { Problem } from '../types';
import Analysis from '../components/Analysis';

export default function ImportPage({ openSettings, configured, goLibrary }: { openSettings: () => void; configured: boolean; goLibrary: () => void }) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Problem | null>(null);
  const locked = useRef(false);

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
    setBusy(true); setError(''); setResult(null);
    try {
      const cleanUrl = url.trim();
      if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) throw new Error('题目链接需以 http:// 或 https:// 开头。');
      if (cleanUrl) new URL(cleanUrl);
      const data = await analyzeProblem(text, loadAIConfig());
      const now = Date.now();
      // 1.2 题干、分析和新卡片一次保存，成功后才清空输入
      const problem: Problem = {
        id: crypto.randomUUID(), title: data.title, description: text.trim(), url: cleanUrl,
        difficulty: data.difficulty, primaryPatternId: data.primaryPatternId, secondaryPatternIds: data.secondaryPatternIds,
        aiAnalysis: { coreInsight: data.coreInsight, skeleton: data.skeleton, prerequisites: data.prerequisites, warnings: data.warnings },
        notes: '', codeDrafts: {}, fsrsCard: newCard(new Date(now)), createdAt: now, updatedAt: now,
      };
      await saveProblem(problem);
      setResult(problem); setText(''); setUrl('');
      logger.info('题目导入完成');
    } catch (e) { setError(e instanceof Error ? e.message : '导入失败，请重试。'); }
    finally { locked.current = false; setBusy(false); }
  }
  return <div className="import-grid">
    <div className="space-y-6">
      <div className="page-heading"><p className="eyebrow">从一道题，找到一类解法</p><h1>导入你的下一道题<span className="gold">.</span></h1>
        <p className="muted">粘贴题目，提炼模式。下次遇见，从理解开始。</p></div>
      <form className="panel space-y-5" onSubmit={submit}>
        <div className="panel-heading"><h2>题目内容</h2><span className="mono muted text-xs">TEXT → PATTERN</span></div>
        <label className="field">原题链接 <span className="muted font-normal">可选</span><input type="url" value={url} disabled={busy}
          onChange={e => setUrl(e.target.value)} placeholder="https://leetcode.cn/problems/..." /></label>
        <label className="field">题目描述<textarea aria-label="题目描述" required rows={11} value={text} disabled={busy} onChange={e => setText(e.target.value)}
          placeholder={'粘贴完整题目描述，包括示例与约束。\n\n例如：给定一个整数数组 nums 和目标值 target，找出和为 target 的两个数，返回它们的下标。'} /></label>
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="muted text-xs">手动粘贴，不自动读取链接</span><span className="mono muted text-xs">{text.length} 字符</span></div>
        {!configured && <div className="notice flex items-center justify-between gap-3"><span>先连接模型，开始分析题目。</span><button type="button" className="text-button" onClick={openSettings}>配置 AI →</button></div>}
        {error && <p role="alert" className="error">{error}</p>}
        <button type="submit" className="primary w-full" disabled={busy || !text.trim() || !configured}>{busy ? '正在分析并保存…' : '导入并解析 →'}</button>
        <p className="muted text-xs text-center" aria-live="polite">{busy ? '分析最多等待 60 秒，请保持页面打开。' : '题目保存在此浏览器；分析时题目文本会发送到你配置的 AI 服务。'}</p>
      </form>
      {result && <section className="panel result" aria-live="polite"><div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div><p className="success text-xs mb-2">已保存到题库</p><h2>{result.title}</h2></div><button className="secondary" onClick={goLibrary}>查看题库 →</button></div>
        <Analysis problem={result} /></section>}
    </div>
    <aside className="space-y-6 import-aside"><section className="panel path-panel"><p className="eyebrow">学习路径</p><h2>做过，还要记得住。</h2>
      <ol className="learning-path"><li><span>01</span><div><strong>识别模式</strong><p>从题目中提炼关键条件与解法。</p></div></li>
        <li><span>02</span><div><strong>独立回忆</strong><p>先自己推导，再展开洞察与骨架。</p></div></li>
        <li><span>03</span><div><strong>间隔复习</strong><p>按真实回忆表现，安排下次相遇。</p></div></li></ol>
      <div className="path-note">不追求刷过多少题。<br />关注能独立解决哪类题。</div></section>
      <section className="panel"><div className="panel-heading"><h2>核心模式</h2><span className="mono muted text-xs">16 PATTERNS</span></div>
        <div className="pattern-grid">{PATTERNS.map(p => <span key={p.id} title={p.description}>{p.name}</span>)}</div>
      </section>
    </aside>
  </div>;
}
