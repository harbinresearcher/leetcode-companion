import type { Problem } from '../types';
import { getPatternName } from '../patterns';

export default function Analysis({ problem }: { problem: Problem }) {
  return <div className="analysis space-y-5">
    <div className="flex flex-wrap gap-2"><span className="badge accent">{getPatternName(problem.primaryPatternId)}</span>
      {problem.secondaryPatternIds.map(id => <span className="badge" key={id}>{getPatternName(id)}</span>)}
    </div>
    {problem.aiAnalysis.warnings.length > 0 && <div className="notice" role="status">
      <strong>分析需要确认</strong>{problem.aiAnalysis.warnings.map(w => <p key={w}>{w}</p>)}
    </div>}
    <section><h3 className="section-label">核心洞察</h3><p className="leading-relaxed">{problem.aiAnalysis.coreInsight}</p></section>
    <section><div className="flex items-center justify-between"><h3 className="section-label">代码骨架</h3><span className="mono muted text-xs">TypeScript</span></div>
      <pre><code>{problem.aiAnalysis.skeleton}</code></pre>
    </section>
    {problem.aiAnalysis.prerequisites.length > 0 && <section><h3 className="section-label">前置知识</h3>
      <div className="flex flex-wrap gap-2">{problem.aiAnalysis.prerequisites.map(p => <span className="badge" key={p}>{p}</span>)}</div>
    </section>}
  </div>;
}
