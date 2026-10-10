import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeProblem, parseAnalysis } from '../src/ai';
import { resolveProblemSource } from '../src/source';
import { AlgoRhythmDB, saveReview } from '../src/db';
import { newCard, Rating } from '../src/fsrs';
import { PATTERNS } from '../src/patterns';
import type { Problem } from '../src/types';

const logger = console;
const config = { apiKey: 'test-only', baseUrl: 'https://example.test/v1/', model: 'test' };
const analysis = {
  isAlgorithmProblem: true,
  title: '两数之和',
  difficulty: 'easy',
  primaryPatternId: 'hash-map',
  secondaryPatternIds: [],
  coreInsight: '查询已经出现的补数',
  skeleton: 'const seen = new Map();',
  prerequisites: ['哈希表'],
};

/*
 * ========================================================================
 * 步骤1：验证解析边界和持久化评分
 * ========================================================================
 * 目标：外部数据不能破坏本地题库
 * 操作：1) 构造异常响应 2) 使用真实 Dexie 与模拟 IndexedDB 验证事务
 */
logger.info('开始核心行为测试');

// 1.1 每个测试后恢复请求替身
afterEach(() => vi.unstubAllGlobals());

describe('AI analysis boundary', () => {
  it('has exactly the approved 16 unique patterns', () => {
    expect(PATTERNS).toHaveLength(16);
    expect(new Set(PATTERNS.map((p) => p.id)).size).toBe(16);
  });
  it('accepts fenced JSON and removes invalid, duplicate and primary secondary IDs', () => {
    const result = parseAnalysis(
      '```json\n' +
        JSON.stringify({
          ...analysis,
          secondaryPatternIds: ['stack', 'unknown', 'stack', 'hash-map', 4],
        }) +
        '\n```',
    );
    expect(result.secondaryPatternIds).toEqual(['stack']);
    expect(result.primaryPatternId).toBe('hash-map');
  });
  it('defaults wrong field types and reports uncertain classification', () => {
    const result = parseAnalysis(
      JSON.stringify({
        isAlgorithmProblem: true,
        title: '两数之和',
        difficulty: [],
        primaryPatternId: 'made-up',
        secondaryPatternIds: 'stack',
        prerequisites: [false, '数组'],
      }),
    );
    expect(result.title).toBe('两数之和');
    expect(result.difficulty).toBe('medium');
    expect(result.secondaryPatternIds).toEqual([]);
    expect(result.prerequisites).toEqual(['数组']);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(PATTERNS.some((p) => p.id === result.primaryPatternId)).toBe(true);
  });
  it('does not coerce arrays to valid difficulty strings or accept prototype keys as patterns', () => {
    const result = parseAnalysis(
      JSON.stringify({ ...analysis, difficulty: ['easy'], primaryPatternId: '__proto__' }),
    );
    expect(result.difficulty).toBe('medium');
    expect(result.primaryPatternId).not.toBe('__proto__');
  });
  it.each(['not JSON', 'null', '[]', '42'])('rejects unusable JSON: %s', (content) => {
    expect(() => parseAnalysis(content)).toThrow();
  });
  it('rejects unrelated content and missing acceptance rather than saving a placeholder', () => {
    expect(() => parseAnalysis(JSON.stringify({ isAlgorithmProblem: false }))).toThrow(
      '只允许导入算法题',
    );
    expect(() => parseAnalysis(JSON.stringify({ title: '未提供题目' }))).toThrow();
    expect(() => parseAnalysis(JSON.stringify({ ...analysis, title: '' }))).toThrow();
  });
  it('normalizes URL and sends raw problem as untrusted user content', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(analysis) } }],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    await analyzeProblem('题目文本', config);
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/v1/chat/completions');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].content).toBe('题目文本');
  });
  it('returns actionable HTTP errors without leaking server text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private-key', { status: 401 })));
    await expect(analyzeProblem('题目', config)).rejects.toThrow('401');
    await expect(analyzeProblem('题目', config)).rejects.not.toThrow('private-key');
  });
  it('rejects missing assistant content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
    await expect(analyzeProblem('题目', config)).rejects.toThrow('内容');
  });
});

describe('problem source', () => {
  it('reads URL-only input and preserves fetched content even with a one-character supplement', async () => {
    const content =
      '两数之和。给定整数数组 nums 和 target，返回和为目标值的两个下标。示例与约束：只有一个答案。';
    const mock = vi.fn().mockResolvedValue(new Response(content));
    vi.stubGlobal('fetch', mock);
    expect(await resolveProblemSource('', 'https://leetcode.cn/problems/two-sum/')).toContain(
      content,
    );
    mock.mockResolvedValue(new Response(content));
    expect(await resolveProblemSource('字', 'https://leetcode.cn/problems/two-sum/')).toContain(
      content,
    );
    expect(mock.mock.calls[0][0]).toBe('https://r.jina.ai/https://leetcode.cn/problems/two-sum/');
    expect(mock.mock.calls[0][1].headers).toBeUndefined();
  });
  it('allows text-only input without any webpage request', async () => {
    const mock = vi.fn();
    vi.stubGlobal('fetch', mock);
    expect(await resolveProblemSource(' 完整题干 ', '')).toBe('完整题干');
    expect(mock).not.toHaveBeenCalled();
  });
  it('reports fetch status and never silently substitutes the supplementary text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })));
    await expect(
      resolveProblemSource('字', 'https://leetcode.cn/problems/two-sum/'),
    ).rejects.toThrow('429');
  });
  it('rejects empty content, invalid links and network errors', async () => {
    await expect(resolveProblemSource('', '')).rejects.toThrow('请提供');
    await expect(resolveProblemSource('', 'javascript:alert(1)')).rejects.toThrow('HTTP(S)');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('')));
    await expect(resolveProblemSource('', 'https://example.com')).rejects.toThrow('没有可读正文');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(resolveProblemSource('', 'https://example.com')).rejects.toThrow('检查网络');
  });
});

describe('IndexedDB and FSRS', () => {
  it('persists Date values across reopening and atomically prevents duplicate ratings', async () => {
    // 1.2 保存新卡片并重开数据库，验证日期与到期索引
    const db = new AlgoRhythmDB('test-' + crypto.randomUUID());
    const now = new Date('2026-10-09T06:00:00Z');
    const problem: Problem = {
      id: crypto.randomUUID(),
      title: analysis.title,
      description: '完整题干',
      url: '',
      difficulty: 'easy',
      primaryPatternId: 'hash-map',
      secondaryPatternIds: [],
      aiAnalysis: {
        coreInsight: analysis.coreInsight,
        skeleton: analysis.skeleton,
        prerequisites: analysis.prerequisites,
        warnings: [],
      },
      notes: '',
      codeDrafts: {},
      fsrsCard: newCard(now),
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
    };
    try {
      await db.problems.add(problem);
      db.close();
      await db.open();
      const stored = await db.problems.get(problem.id);
      expect(stored?.fsrsCard.due).toBeInstanceOf(Date);
      expect(await db.problems.where('fsrsCard.due').belowOrEqual(now).count()).toBe(1);
      // 1.3 相同快照并发评分只能成功一次
      const results = await Promise.allSettled([
        saveReview(problem, Rating.Good, now, db),
        saveReview(problem, Rating.Good, now, db),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const updated = await db.problems.get(problem.id);
      expect(updated?.fsrsCard.reps).toBe(1);
      expect(updated?.fsrsCard.due.getTime()).toBeGreaterThan(now.getTime());
      expect(await db.problems.where('fsrsCard.due').belowOrEqual(now).count()).toBe(0);
    } finally {
      await db.delete();
    }
  });
});
logger.info('核心行为测试已注册');
