import type { Card } from 'ts-fsrs';
import type { Problem } from './types';
import { db } from './db';
import { logger } from './logger';

export const BACKUP_APP_ID = 'algorhythm';
export const BACKUP_SCHEMA_VERSION = 1;
export interface BackupFile {
  schemaVersion: number;
  app: string;
  exportedAt: string;
  count: number;
  problems: Problem[];
}
export interface ParsedBackup {
  valid: Problem[];
  invalidCount: number;
  duplicateInFileCount: number;
}
export type ImportMode = 'skip' | 'overwrite';
export interface ImportOutcome {
  added: number;
  overwritten: number;
  skipped: number;
}

export function buildBackup(problems: Problem[], now = new Date()): BackupFile {
  /*
   * ========================================================================
   * 步骤1：挑选备份字段
   * ========================================================================
   * 数据源：题库；操作：1) 顶层与内嵌对象白名单 2) 不导出设置
   */
  logger.info('开始构造备份');
  // 1.1 逐字段复制，不把未知字段带入文件
  const selected = problems.map((p): Problem => ({
    id: p.id,
    title: p.title,
    url: p.url,
    difficulty: p.difficulty,
    description: p.description,
    primaryPatternId: p.primaryPatternId,
    secondaryPatternIds: [...p.secondaryPatternIds],
    aiAnalysis: {
      coreInsight: p.aiAnalysis.coreInsight,
      skeleton: p.aiAnalysis.skeleton,
      prerequisites: [...p.aiAnalysis.prerequisites],
      warnings: [...p.aiAnalysis.warnings],
    },
    fsrsCard: {
      due: p.fsrsCard.due,
      stability: p.fsrsCard.stability,
      difficulty: p.fsrsCard.difficulty,
      elapsed_days: p.fsrsCard.elapsed_days,
      scheduled_days: p.fsrsCard.scheduled_days,
      learning_steps: p.fsrsCard.learning_steps,
      reps: p.fsrsCard.reps,
      lapses: p.fsrsCard.lapses,
      state: p.fsrsCard.state,
      ...(p.fsrsCard.last_review === undefined ? {} : { last_review: p.fsrsCard.last_review }),
    },
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
  logger.info('备份构造完成');
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    app: BACKUP_APP_ID,
    exportedAt: now.toISOString(),
    count: selected.length,
    problems: selected,
  };
}

export function backupFileName(now = new Date()): string {
  /*
   * ========================================================================
   * 步骤1：生成本地时间文件名
   * ========================================================================
   * 数据源：指定时间；操作：1) 补齐两位 2) 使用本地年月日时分
   */
  logger.info('开始生成备份文件名');
  // 1.1 本地时间不使用 UTC 字符串截取
  const pad = (n: number) => String(n).padStart(2, '0');
  const name = `algorhythm-backup-${String(now.getFullYear()).padStart(4, '0')}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.json`;
  logger.info('备份文件名生成完成');
  return name;
}

export function downloadBackup(file: BackupFile): void {
  /*
   * ========================================================================
   * 步骤1：下载并释放备份资源
   * ========================================================================
   * 数据源：备份对象；操作：1) 创建 JSON Blob 2) 下载后释放 URL
   */
  logger.info('开始下载备份');
  // 1.1 仅操作浏览器下载，不写数据库
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }),
  );
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = backupFileName();
    anchor.click();
  } finally {
    // 1.2 点击失败也释放资源
    URL.revokeObjectURL(url);
  }
  logger.info('备份下载完成');
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const stringOrEmpty = (value: unknown): string => (typeof value === 'string' ? value : '');
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

function restoreCard(value: unknown): Card | undefined {
  /*
   * ========================================================================
   * 步骤1：校验卡片并恢复日期
   * ========================================================================
   * 数据源：JSON 卡片；操作：1) 验证必需字段 2) 仅恢复类型，不重新排期
   */
  logger.info('开始校验备份卡片');
  // 1.1 不把对象断言为 Card，不用新卡掩盖损坏
  if (
    !isRecord(value) ||
    typeof value.due !== 'string' ||
    !finite(value.stability) ||
    !finite(value.difficulty) ||
    !finite(value.elapsed_days) ||
    !finite(value.scheduled_days) ||
    !finite(value.learning_steps) ||
    !finite(value.reps) ||
    !finite(value.lapses) ||
    (value.state !== 0 && value.state !== 1 && value.state !== 2 && value.state !== 3) ||
    (value.last_review !== undefined && typeof value.last_review !== 'string')
  ) {
    logger.info('备份卡片校验未通过');
    return undefined;
  }
  // 1.2 日期须可解析，数值字段保持原值
  const due = new Date(value.due);
  const lastReview = value.last_review === undefined ? undefined : new Date(value.last_review);
  if (!Number.isFinite(due.getTime()) || (lastReview && !Number.isFinite(lastReview.getTime()))) {
    logger.info('备份卡片日期无效');
    return undefined;
  }
  const card: Card = {
    due,
    stability: value.stability,
    difficulty: value.difficulty,
    elapsed_days: value.elapsed_days,
    scheduled_days: value.scheduled_days,
    learning_steps: value.learning_steps,
    reps: value.reps,
    lapses: value.lapses,
    state: value.state,
    ...(lastReview === undefined ? {} : { last_review: lastReview }),
  };
  logger.info('备份卡片校验完成');
  return card;
}

export function parseBackup(text: string): ParsedBackup {
  /*
   * ========================================================================
   * 步骤1：校验文件并恢复合法题目
   * ========================================================================
   * 数据源：JSON 文本；操作：1) 整体错误中止 2) 坏条目与重复分别计数
   */
  logger.info('开始解析备份');
  // 1.1 外部数据保持 unknown，逐层验证
  let file: unknown;
  try {
    file = JSON.parse(text);
  } catch (cause) {
    throw new Error('备份文件不是有效的 JSON。', { cause });
  }
  if (!isRecord(file) || file.app !== BACKUP_APP_ID)
    throw new Error('这不是 AlgoRhythm 的备份文件。');
  if (file.schemaVersion !== BACKUP_SCHEMA_VERSION)
    throw new Error(
      `备份文件版本不受支持（版本 ${String(file.schemaVersion)}），请升级 AlgoRhythm 后再导入。`,
    );
  if (!Array.isArray(file.problems)) throw new Error('备份文件缺少题目列表，可能已损坏。');
  const result: ParsedBackup = { valid: [], invalidCount: 0, duplicateInFileCount: 0 };
  const seen = new Set<string>();
  const timestamp = Date.now();
  // 1.2 先校验合法性，再保留每个 ID 的第一条合法数据
  for (const p of file.problems) {
    const card = isRecord(p) ? restoreCard(p.fsrsCard) : undefined;
    if (
      !isRecord(p) ||
      typeof p.id !== 'string' ||
      !p.id.trim() ||
      typeof p.title !== 'string' ||
      !p.title.trim() ||
      !card
    ) {
      result.invalidCount++;
      continue;
    }
    if (seen.has(p.id)) {
      result.duplicateInFileCount++;
      continue;
    }
    seen.add(p.id);
    const ai = isRecord(p.aiAnalysis) ? p.aiAnalysis : {};
    result.valid.push({
      id: p.id,
      title: p.title,
      url: stringOrEmpty(p.url),
      description: stringOrEmpty(p.description),
      difficulty: p.difficulty === 'easy' || p.difficulty === 'hard' ? p.difficulty : 'medium',
      primaryPatternId:
        typeof p.primaryPatternId === 'string' ? p.primaryPatternId : 'two-pointers',
      secondaryPatternIds: strings(p.secondaryPatternIds),
      aiAnalysis: {
        coreInsight: stringOrEmpty(ai.coreInsight),
        skeleton: stringOrEmpty(ai.skeleton),
        prerequisites: strings(ai.prerequisites),
        warnings: strings(ai.warnings),
      },
      fsrsCard: card,
      createdAt: finite(p.createdAt) ? p.createdAt : timestamp,
      updatedAt: finite(p.updatedAt) ? p.updatedAt : timestamp,
    });
  }
  logger.info('备份解析完成');
  return result;
}

export async function applyImport(
  incoming: Problem[],
  existingIds: Set<string>,
  mode: ImportMode,
  now = new Date(),
): Promise<ImportOutcome> {
  /*
   * ========================================================================
   * 步骤1：单事务恢复备份
   * ========================================================================
   * 目标表：problems；操作：1) 重新核对实际 ID 2) 新增用 add，允许覆盖才 put
   */
  logger.info('开始恢复备份');
  // 1.1 existingIds 是预览快照；用户确认以事务内实际状态判定
  void existingIds;
  const outcome = await db.transaction('rw', db.problems, async () => {
    const result: ImportOutcome = { added: 0, overwritten: 0, skipped: 0 };
    for (const p of incoming) {
      const current = await db.problems.get(p.id);
      if (current && mode === 'skip') {
        result.skipped++;
        continue;
      }
      // 1.2 仅更新更新时间，卡片不经 FSRS 调度
      const restored = { ...p, updatedAt: now.getTime() };
      if (current) {
        await db.problems.put(restored);
        result.overwritten++;
      } else {
        await db.problems.add(restored);
        result.added++;
      }
    }
    return result;
  });
  logger.info('备份恢复完成');
  return outcome;
}
