import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeProblem, parseAnalysis } from '../src/ai';
import { resolveProblemSource } from '../src/source';
import { AlgoRhythmDB, saveReview } from '../src/db';
import { newCard, Rating } from '../src/fsrs';
import { PATTERNS } from '../src/patterns';
import type { Problem } from '../src/types';
import * as backup from '../src/backup';
import { db as backupDb } from '../src/db';

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

/*
 * ========================================================================
 * 步骤2：验证备份文件与事务恢复
 * ========================================================================
 * 数据源：人工夹具与 fake-indexeddb；操作：1) 真实 JSON 往返 2) 验证事务边界
 */
logger.info('开始注册备份测试');
// 2.1 固定时间与合法卡片，避免依赖当前排期
const backupNow = new Date('2026-10-10T06:00:00Z');
function backupProblem(id = 'one'): Problem {
  return {
    id,
    title: '示例题',
    url: '',
    description: '测试题干',
    difficulty: 'easy',
    primaryPatternId: 'hash-map',
    secondaryPatternIds: ['stack'],
    aiAnalysis: { coreInsight: '洞察', skeleton: '骨架', prerequisites: ['数组'], warnings: [] },
    fsrsCard: {
      due: backupNow,
      stability: 2,
      difficulty: 3,
      elapsed_days: 1,
      scheduled_days: 2,
      learning_steps: 0,
      reps: 4,
      lapses: 1,
      state: 2,
      last_review: new Date('2026-10-09T06:00:00Z'),
    },
    createdAt: 1,
    updatedAt: 2,
  };
}
const backupText = (problems: unknown[]) =>
  JSON.stringify({
    app: 'algorhythm',
    schemaVersion: 1,
    problems,
  });

describe('backup core', () => {
  // 2.2 捕获直接 dump 顶层或嵌套对象造成的敏感字段泄漏
  it('exports only approved fields at every level and uses local file time', () => {
    const problem = backupProblem();
    Object.assign(problem, { apiKey: 'secret', notes: 'private', codeDrafts: { x: 'private' } });
    Object.assign(problem.aiAnalysis, { apiKey: 'secret' });
    Object.assign(problem.fsrsCard, { authorization: 'secret' });
    const file = backup.buildBackup([problem], backupNow);
    expect(file).toMatchObject({
      app: 'algorhythm',
      schemaVersion: 1,
      count: 1,
      exportedAt: '2026-10-10T06:00:00.000Z',
    });
    expect(JSON.stringify(file)).not.toMatch(/secret|notes|codeDrafts|apiKey|authorization/);
    expect(backup.backupFileName(new Date(2026, 0, 2, 3, 4))).toBe(
      'algorhythm-backup-20260102-0304.json',
    );
    expect(backup.buildBackup([], backupNow).count).toBe(0);
  });
  it.each([
    ['{', '备份文件不是有效的 JSON。'],
    ['null', '这不是 AlgoRhythm 的备份文件。'],
    ['{}', '这不是 AlgoRhythm 的备份文件。'],
    [
      '{"app":"algorhythm","schemaVersion":9}',
      '备份文件版本不受支持（版本 9），请升级 AlgoRhythm 后再导入。',
    ],
    ['{"app":"algorhythm","schemaVersion":1}', '备份文件缺少题目列表，可能已损坏。'],
  ])('rejects whole-file errors without writes: %s', (text, message) => {
    expect(() => backup.parseBackup(text)).toThrow(message);
  });
  it('counts invalid cards and duplicate valid IDs separately', () => {
    const p = backupProblem();
    const invalid = [
      null,
      { ...p, id: '' },
      { ...p, title: '' },
      { ...p, fsrsCard: null },
      { ...p, fsrsCard: {} },
      { ...p, fsrsCard: [] },
      { ...p, fsrsCard: { ...p.fsrsCard, due: 'bad' } },
      { ...p, fsrsCard: { ...p.fsrsCard, reps: '4' } },
    ];
    const result = backup.parseBackup(backupText([...invalid, p, { ...p, title: '第二条' }]));
    expect(result.invalidCount).toBe(8);
    expect(result.duplicateInFileCount).toBe(1);
    expect(result.valid.map((p) => p.title)).toEqual(['示例题']);
  });
  it('normalizes optional fields and restores exact Date values through JSON', () => {
    const p = backupProblem();
    const result = backup.parseBackup(
      backupText([
        {
          ...p,
          url: 1,
          description: null,
          difficulty: [],
          primaryPatternId: null,
          secondaryPatternIds: [1, 'stack'],
          createdAt: null,
          updatedAt: 'bad',
          aiAnalysis: { warnings: 1, prerequisites: [true, '数组'] },
        },
      ]),
    );
    expect(result.valid[0]).toMatchObject({
      url: '',
      description: '',
      difficulty: 'medium',
      primaryPatternId: 'two-pointers',
      secondaryPatternIds: ['stack'],
      aiAnalysis: { coreInsight: '', skeleton: '', warnings: [], prerequisites: ['数组'] },
    });
    expect(Number.isFinite(result.valid[0].createdAt)).toBe(true);
    expect(Number.isFinite(result.valid[0].updatedAt)).toBe(true);
    expect(result.valid[0].fsrsCard).toEqual(p.fsrsCard);
    expect(result.valid[0].fsrsCard.due.toLocaleString()).toBe(backupNow.toLocaleString());
  });
  // 2.3 所有恢复测试使用可删除的模拟数据库，不访问用户浏览器
  it('imports exact FSRS values, skips then overwrites, and preserves the due index', async () => {
    try {
      await backupDb.open();
      const incoming = backup.parseBackup(
        JSON.stringify(backup.buildBackup([backupProblem()], backupNow)),
      ).valid;
      expect(await backup.applyImport(incoming, new Set(), 'skip', backupNow)).toEqual({
        added: 1,
        overwritten: 0,
        skipped: 0,
      });
      const stored = await backupDb.problems.get('one');
      expect(stored?.fsrsCard).toEqual(backupProblem().fsrsCard);
      expect(stored?.updatedAt).toBe(backupNow.getTime());
      expect(await backupDb.problems.where('fsrsCard.due').belowOrEqual(backupNow).count()).toBe(1);
      incoming[0].title = '备份版本';
      expect(await backup.applyImport(incoming, new Set(['one']), 'skip')).toEqual({
        added: 0,
        overwritten: 0,
        skipped: 1,
      });
      expect((await backupDb.problems.get('one'))?.title).toBe('示例题');
      expect(await backup.applyImport(incoming, new Set(['one']), 'overwrite')).toEqual({
        added: 0,
        overwritten: 1,
        skipped: 0,
      });
      expect((await backupDb.problems.get('one'))?.title).toBe('备份版本');
    } finally {
      await backupDb.delete();
    }
  });
  it('uses transaction-time IDs when the preview is stale', async () => {
    try {
      await backupDb.open();
      await backupDb.problems.add(backupProblem());
      const incoming = [{ ...backupProblem(), title: '旧备份' }, backupProblem('deleted')];
      expect(await backup.applyImport(incoming, new Set(['deleted']), 'skip')).toEqual({
        added: 1,
        overwritten: 0,
        skipped: 1,
      });
      expect((await backupDb.problems.get('one'))?.title).toBe('示例题');
      await backupDb.problems.delete('deleted');
      expect(await backup.applyImport(incoming, new Set(['deleted']), 'overwrite')).toEqual({
        added: 1,
        overwritten: 1,
        skipped: 0,
      });
    } finally {
      await backupDb.delete();
    }
  });
  it('rolls back earlier additions when a later add fails', async () => {
    try {
      await backupDb.open();
      const broken = {
        ...backupProblem('bad'),
        fsrsCard: { ...backupProblem().fsrsCard, unknown: () => 1 },
      };
      await expect(
        backup.applyImport([backupProblem(), broken], new Set(), 'skip'),
      ).rejects.toThrow();
      expect(await backupDb.problems.count()).toBe(0);
    } finally {
      await backupDb.delete();
    }
  });
  it('downloads serialized JSON and releases its URL even when clicking fails', async () => {
    let blob: Blob | undefined;
    const released: string[] = [];
    const anchor = {
      href: '',
      download: '',
      click: () => {
        throw new Error('click failed');
      },
    };
    vi.stubGlobal('document', { createElement: () => anchor });
    vi.stubGlobal('URL', {
      createObjectURL: (value: Blob) => {
        blob = value;
        return 'blob:test';
      },
      revokeObjectURL: (url: string) => released.push(url),
    });
    const file = backup.buildBackup([], backupNow);
    expect(() => backup.downloadBackup(file)).toThrow('click failed');
    expect(released).toEqual(['blob:test']);
    expect(JSON.parse(await blob!.text())).toEqual(file);
    expect(anchor.download).toMatch(/^algorhythm-backup-\d{8}-\d{4}\.json$/);
  });
});
logger.info('备份测试注册完成');
