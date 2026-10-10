# 切片 1 实施计划：CI 安全网 + 数据备份

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 AlgoRhythm 装上自动化质量门（CI + 依赖自动化），并让用户能把题库导出成文件、再从文件恢复。

**Architecture:** 两半互不依赖。工程侧新增两个 GitHub Actions 配置文件，不改应用代码；产品侧新增一个纯逻辑模块 `src/backup.ts`（不依赖 React，可独立测试），题库页只负责文件选择与预览弹窗。备份格式自带 `schemaVersion`，字段用白名单挑选，为将来的数据结构迁移留依据。

**Tech Stack:** React 18 + TypeScript 5 + Vite 6 + Dexie(IndexedDB) + Vitest 5 + fake-indexeddb。CI 用 GitHub Actions（`actions/checkout@v4` + `actions/setup-node@v4`）。

**规格来源：** `docs/superpowers/specs/2026-10-10-slice-1-ci-and-data-backup-design.md`（已获用户批准）。规格的**附录 A** 是给编码 Agent 的施工简报，与本计划的 Task 5–9 对应。

## Global Constraints

以下为项目级约束，**每个任务都隐含包含**：

- **Node 版本声明**：`package.json` 的 `engines.node` 必须是 `^22.13.0 || ^24.0.0 || >=26.0.0`（不是 22.12 —— eslint 10 要求 `^22.13.0`）。
- **零新增依赖**：备份功能只用浏览器原生 API（`Blob`、`URL.createObjectURL`、`FileReader`/`File.text()`）。
- **不改动**：`src/ai.ts`、`src/fsrs.ts`、`src/db.ts` 的现有行为。
- **日志纪律**：沿用现有 `logger.info` 风格；日志**不得**包含题目全文、API Key 或任何请求头。
- **提交信息格式**：`类型: 简短说明`，类型限 `feat` / `fix` / `docs` / `chore`。
- **提交前必跑**：`npm run lint && npm run format:check && npm test && npm run build`，四项全绿。
- **UI 文案一字不差**：见规格 §附录 A.3 的文案表；错误文案见 A.1 的报错表。
- **分支**：全部工作提交到已存在的 `feature/slice-1-design` 分支（PR #2），不新建分支。

## File Structure

| 文件 | 责任 | 归属任务 |
| --- | --- | --- |
| `.github/workflows/ci.yml` | 新增。CI 唯一入口：lint / format:check / test / build | Task 1 |
| `.github/dependabot.yml` | 新增。每周依赖更新，按 production/development 分组 | Task 2 |
| `src/backup.ts` | 新增。备份的**全部纯逻辑**：构造、文件名、下载、解析、校验、入库。不引入 React | Task 6–8 |
| `src/pages/ProblemsPage.tsx` | 修改。只加两个按钮与预览弹窗，业务逻辑全部委托给 `backup.ts` | Task 9 |
| `src/types.ts` | 修改。删两个死字段 | Task 5 |
| `src/pages/ImportPage.tsx` | 修改。删两行死字段初始化 | Task 5 |
| `tests/core.test.ts` | 修改。追加备份相关测试 | Task 6–8 |
| `package.json` | 修改。`engines.node` | Task 3 |
| `README.md` / `CONTRIBUTING.md` / `docs/STATUS.md` | 修改。22.12 → 22.13；README 徽章 URL 同步 | Task 3 |
| `AGENTS.md` / `docs/ROADMAP.md` / `docs/STATUS.md` | 修改。推翻"MVP 不加 Actions"规则并记录进度 | Task 4 |

---

### Task 1: CI 工作流（归属：我）

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: 无
- Produces: GitHub 上名为 `CI` 的工作流，job 名 `lint / format / test / build`。Task 10 依赖它验证。

- [ ] **Step 1: 创建 `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
      - 'LICENSE'
      - '.gitignore'
      - '.editorconfig'
  pull_request:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
      - 'LICENSE'
      - '.gitignore'
      - '.editorconfig'

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  verify:
    name: lint / format / test / build
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: 本地先验证工作流里那四条命令真的能过**

Run: `npm ci && npm run lint && npm run format:check && npm test && npm run build`
Expected: 全部退出码 0。`npm ci` 会重建 `node_modules`，属正常。

- [ ] **Step 3: 用 Node 24 语义复核依赖兼容性（本地是 Node 26）**

Run:
```bash
node -e "const s=require('./node_modules/semver');const fs=require('fs');const p=[];const pj=f=>{try{const j=JSON.parse(fs.readFileSync(f));if(j.engines&&j.engines.node)p.push([j.name,j.engines.node])}catch{}};for(const e of fs.readdirSync('node_modules')){if(e.startsWith('.'))continue;const d='node_modules/'+e;if(!fs.statSync(d).isDirectory())continue;if(e.startsWith('@')){for(const x of fs.readdirSync(d))pj(d+'/'+x+'/package.json')}else pj(d+'/package.json')};const bad=p.filter(([n,r])=>{try{return !s.satisfies('24.0.0',r,{includePrerelease:true})}catch{return false}});console.log('不满足 Node 24 的包:',bad.length,bad.map(x=>x[0]).join(','))"
```
Expected: `不满足 Node 24 的包: 0`

- [ ] **Step 4: 提交**

```bash
git add .github/workflows/ci.yml
git commit -m "chore: add CI workflow for lint, format, test and build"
```

---

### Task 2: 依赖自动化（归属：我）

**Files:**
- Create: `.github/dependabot.yml`

**Interfaces:**
- Consumes: 无
- Produces: Dependabot 每周依赖更新 PR，按 production / development 分组。

- [ ] **Step 1: 创建 `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: weekly
    groups:
      dependencies:
        dependency-type: production
      devDependencies:
        dependency-type: development
```

- [ ] **Step 2: 提交**

```bash
git add .github/dependabot.yml
git commit -m "chore: add grouped weekly dependabot updates"
```

> 若 GitHub 在 PR 里提示该文件格式有误，回到规格 §4.2 核对；不要凭记忆改字段名。

---

### Task 3: 修正 Node 版本声明（归属：我）

**Files:**
- Modify: `package.json`（`engines.node`）
- Modify: `README.md`（第 4 行徽章 URL、第 19 行正文）
- Modify: `CONTRIBUTING.md`（第 9 行）
- Modify: `docs/STATUS.md`（「如何运行」一节）

**Interfaces:**
- Consumes: 无
- Produces: `engines.node === "^22.13.0 || ^24.0.0 || >=26.0.0"`

- [ ] **Step 1: 改 `package.json`**

把：
```json
  "engines": {
    "node": "^22.12.0 || ^24.0.0 || >=26.0.0"
  },
```
改为：
```json
  "engines": {
    "node": "^22.13.0 || ^24.0.0 || >=26.0.0"
  },
```

- [ ] **Step 2: 改三处文档正文的 `22.12+` → `22.13+`**

`README.md` 第 19 行、`CONTRIBUTING.md` 第 9 行、`docs/STATUS.md` 的「如何运行」一节，都把 `Node.js 22.12+（22.x）` 改为 `Node.js 22.13+（22.x）`。

- [ ] **Step 3: 改 README 徽章 URL 编码**

`README.md` 第 4 行的徽章地址里 `%5E22.12` 改为 `%5E22.13`。改完后该行应为：

```markdown
[![Node.js](https://img.shields.io/badge/Node.js-%5E22.13%20%7C%7C%20%5E24%20%7C%7C%20%3E%3D26-339933?logo=nodedotjs&logoColor=white)](package.json)
```

- [ ] **Step 4: 验证全仓不再有 22.12**

Run: `git grep -n "22\.12" -- . ':(exclude)node_modules' ':(exclude)package-lock.json'`
Expected: 无输出（退出码 1）。

- [ ] **Step 5: 提交**

```bash
git add package.json README.md CONTRIBUTING.md docs/STATUS.md
git commit -m "fix: correct Node version floor from 22.12 to 22.13"
```

---

### Task 4: 规则与进度修订（归属：我）

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/STATUS.md`

**Interfaces:**
- Consumes: Task 1 的 CI 已存在（规则里要引用它）
- Produces: 项目规则允许并依赖 GitHub Actions。

- [ ] **Step 1: 改 `AGENTS.md` 的规则**

把这一行：
```
- 许可证为 MIT。未经用户授权，不公开仓库或发布网站。MVP 暂不添加 GitHub Actions。
```
改为：
```
- 许可证为 MIT。仓库已公开。
- 提交前必须运行 `npm run lint`、`npm run format:check`、`npm test`、`npm run build`；CI 会验证这四项，PR 必须全绿才能合并。
```

- [ ] **Step 2: 勾掉 `docs/ROADMAP.md` 里的对应待办**

把：
```
- [ ] 有实际 PR 协作需求后增加 GitHub Actions（lint + test + build）
```
改为：
```
- [x] GitHub Actions 验证 lint / format:check / test / build
```

- [ ] **Step 3: 更新 `docs/STATUS.md`**

- 「已完成」追加一条：`- GitHub Actions CI（lint / format:check / test / build）与分组 Dependabot 更新。`
- 「本轮验证」新增小节「切片 1 轮（2026-10-10）」，先写占位结论，Task 10 完成后补齐真实结果。
- 「待开始」删掉「有实际 PR 协作需求后再加 GitHub Actions」一条。

- [ ] **Step 4: 提交**

```bash
git add AGENTS.md docs/ROADMAP.md docs/STATUS.md
git commit -m "docs: require CI-green before merge and record slice 1 progress"
```

---

### Task 5: 删除死字段（归属：Codex）

**Files:**
- Modify: `src/types.ts`
- Modify: `src/pages/ImportPage.tsx`

**Interfaces:**
- Consumes: 无
- Produces: `Problem` 接口不再含 `notes`、`codeDrafts`。Task 6 的导出白名单依赖这一事实。

- [ ] **Step 1: 改 `src/types.ts`**

从 `Problem` 接口删除这两行：
```ts
  codeDrafts: Record<string, string>;
  notes: string;
```

- [ ] **Step 2: 改 `src/pages/ImportPage.tsx`**

在构造 `problem` 对象处删除这两行：
```ts
        notes: '',
        codeDrafts: {},
```

- [ ] **Step 3: 验证类型与测试仍然通过**

Run: `npm run build && npm test`
Expected: 两者都通过。若有报错指出 `notes`/`codeDrafts` 被引用，说明还有遗漏的引用点，一并清掉（当前代码库中不应存在）。

- [ ] **Step 4: 提交**

```bash
git add src/types.ts src/pages/ImportPage.tsx
git commit -m "chore: remove unused notes and codeDrafts fields"
```

---

### Task 6: 备份导出（归属：Codex）

**Files:**
- Create: `src/backup.ts`
- Modify: `tests/core.test.ts`

**Interfaces:**
- Consumes: `Problem`（Task 5 已删掉死字段）
- Produces: `BACKUP_APP_ID`、`BACKUP_SCHEMA_VERSION`、`BackupFile`、`buildBackup()`、`backupFileName()`、`downloadBackup()`。Task 7–9 依赖这些名字。

- [ ] **Step 1: 写失败的测试**

追加到 `tests/core.test.ts`：

```ts
import { BACKUP_APP_ID, BACKUP_SCHEMA_VERSION, backupFileName, buildBackup } from '../src/backup';

describe('backup export', () => {
  const sample: Problem = {
    id: 'p1',
    title: '两数之和',
    url: '',
    difficulty: 'easy',
    description: '题干',
    primaryPatternId: 'hash-map',
    secondaryPatternIds: ['two-pointers'],
    aiAnalysis: { coreInsight: '洞察', skeleton: '// 骨架', prerequisites: ['哈希表'], warnings: [] },
    fsrsCard: { due: new Date('2026-01-01T00:00:00Z'), stability: 1, difficulty: 1, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, state: 0, last_review: undefined } as never,
    createdAt: 1,
    updatedAt: 2,
  };

  it('builds a whitelisted backup object with schema version', () => {
    const file = buildBackup([sample], new Date('2026-10-10T03:20:00Z'));
    expect(file.app).toBe(BACKUP_APP_ID);
    expect(file.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(file.count).toBe(1);
    expect(file.exportedAt).toBe('2026-10-10T03:20:00.000Z');
    expect(Object.keys(file.problems[0]).sort()).toEqual(
      ['aiAnalysis', 'createdAt', 'description', 'difficulty', 'fsrsCard', 'id', 'primaryPatternId', 'secondaryPatternIds', 'title', 'updatedAt', 'url'].sort(),
    );
    expect('notes' in file.problems[0]).toBe(false);
    expect('codeDrafts' in file.problems[0]).toBe(false);
  });

  it('names the file with a local timestamp', () => {
    expect(backupFileName(new Date(2026, 9, 10, 15, 4))).toBe('algorhythm-backup-20261010-1504.json');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test`
Expected: FAIL —— `Failed to resolve import "../src/backup"`。

- [ ] **Step 3: 写最小实现**

创建 `src/backup.ts`：

```ts
import type { Problem } from './types';
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

const pad = (n: number) => String(n).padStart(2, '0');

export function backupFileName(now = new Date()): string {
  /* 步骤1：生成备份文件名 */
  // 1.1 使用本地时间，便于用户按日期辨认
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `algorhythm-backup-${stamp}.json`;
}

export function buildBackup(problems: Problem[], now = new Date()): BackupFile {
  /*
   * ========================================================================
   * 步骤1：构造备份对象
   * ========================================================================
   * 数据源：题库；操作：1) 逐字段白名单挑选 2) 附带版本号
   */
  logger.info('开始构造备份');
  // 1.1 白名单挑选，不直接序列化 Problem，避免多余或未来的敏感字段进入备份
  const picked = problems.map((p) => ({
    id: p.id,
    title: p.title,
    url: p.url,
    difficulty: p.difficulty,
    description: p.description,
    primaryPatternId: p.primaryPatternId,
    secondaryPatternIds: p.secondaryPatternIds,
    aiAnalysis: p.aiAnalysis,
    fsrsCard: p.fsrsCard,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  })) as Problem[];
  const file: BackupFile = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    app: BACKUP_APP_ID,
    exportedAt: now.toISOString(),
    count: picked.length,
    problems: picked,
  };
  logger.info('备份构造完成');
  return file;
}

export function downloadBackup(file: BackupFile): void {
  /*
   * ========================================================================
   * 步骤1：触发浏览器下载
   * ========================================================================
   * 目标：本地文件；操作：1) 生成 Blob 2) 触发下载并释放 URL
   */
  logger.info('开始导出备份文件');
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName(new Date(file.exportedAt));
  a.click();
  // 1.1 立即释放，避免内存泄漏
  URL.revokeObjectURL(url);
  logger.info('备份文件导出完成');
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/backup.ts tests/core.test.ts
git commit -m "feat: add backup export with whitelisted fields"
```

---

### Task 7: 备份解析与校验（归属：Codex）

**Files:**
- Modify: `src/backup.ts`
- Modify: `tests/core.test.ts`

**Interfaces:**
- Consumes: Task 6 的 `BACKUP_APP_ID`、`BACKUP_SCHEMA_VERSION`、`BackupFile`
- Produces: `ParsedBackup`、`parseBackup()`。Task 9 依赖它们。

- [ ] **Step 1: 写失败的测试**

```ts
describe('backup parsing', () => {
  const good = JSON.stringify({
    schemaVersion: 1,
    app: 'algorhythm',
    exportedAt: '2026-10-10T00:00:00.000Z',
    count: 1,
    problems: [{ id: 'a', title: '标题', fsrsCard: { reps: 0 } }],
  });

  it('rejects non-JSON, wrong app, unknown version and broken problems list', () => {
    expect(() => parseBackup('not json')).toThrow('备份文件不是有效的 JSON。');
    expect(() => parseBackup(JSON.stringify({ app: 'other', schemaVersion: 1, problems: [] }))).toThrow('这不是 AlgoRhythm 的备份文件。');
    expect(() => parseBackup(JSON.stringify({ app: 'algorhythm', schemaVersion: 99, problems: [] }))).toThrow('备份文件版本不受支持（版本 99），请升级 AlgoRhythm 后再导入。');
    expect(() => parseBackup(JSON.stringify({ app: 'algorhythm', schemaVersion: 1, problems: {} }))).toThrow('备份文件缺少题目列表，可能已损坏。');
  });

  it('skips entries missing id, title or fsrsCard and counts them', () => {
    const text = JSON.stringify({
      schemaVersion: 1,
      app: 'algorhythm',
      exportedAt: 'x',
      count: 4,
      problems: [
        { id: 'a', title: 'A', fsrsCard: { reps: 0 } },
        { title: '没有 id', fsrsCard: {} },
        { id: 'b', fsrsCard: {} },
        { id: 'c', title: 'C' },
      ],
    });
    const parsed = parseBackup(text);
    expect(parsed.valid.map((p) => p.id)).toEqual(['a']);
    expect(parsed.invalidCount).toBe(3);
  });

  it('keeps the first of duplicated ids inside one file', () => {
    const text = JSON.stringify({
      schemaVersion: 1,
      app: 'algorhythm',
      exportedAt: 'x',
      count: 2,
      problems: [
        { id: 'dup', title: '第一条', fsrsCard: {} },
        { id: 'dup', title: '第二条', fsrsCard: {} },
      ],
    });
    const parsed = parseBackup(text);
    expect(parsed.valid).toHaveLength(1);
    expect(parsed.valid[0].title).toBe('第一条');
    expect(parsed.duplicateInFileCount).toBe(1);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test`
Expected: FAIL —— `parseBackup is not a function`。

- [ ] **Step 3: 写最小实现**

追加到 `src/backup.ts`：

```ts
export interface ParsedBackup {
  valid: Problem[];
  invalidCount: number;
  duplicateInFileCount: number;
}

const DEFAULTS = {
  url: '',
  description: '',
  difficulty: 'medium' as Problem['difficulty'],
  primaryPatternId: 'two-pointers',
  aiAnalysis: { coreInsight: '', skeleton: '', prerequisites: [] as string[], warnings: [] as string[] },
};

function normalize(raw: unknown, now: Date): Problem | null {
  /*
   * ========================================================================
   * 步骤1：规范化单条备份记录
   * ========================================================================
   * 数据源：未知结构；操作：1) 校验必需字段 2) 缺失的可选字段补默认值
   */
  // 1.1 三个必需字段任一不合法即视为坏数据
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id.trim()) return null;
  if (typeof o.title !== 'string' || !o.title.trim()) return null;
  if (!o.fsrsCard || typeof o.fsrsCard !== 'object') return null;
  const stamp = now.getTime();
  return {
    id: o.id,
    title: o.title,
    url: typeof o.url === 'string' ? o.url : DEFAULTS.url,
    description: typeof o.description === 'string' ? o.description : DEFAULTS.description,
    difficulty: ['easy', 'medium', 'hard'].includes(o.difficulty as string)
      ? (o.difficulty as Problem['difficulty'])
      : DEFAULTS.difficulty,
    primaryPatternId:
      typeof o.primaryPatternId === 'string' ? o.primaryPatternId : DEFAULTS.primaryPatternId,
    secondaryPatternIds: Array.isArray(o.secondaryPatternIds)
      ? o.secondaryPatternIds.filter((x): x is string => typeof x === 'string')
      : [],
    aiAnalysis:
      o.aiAnalysis && typeof o.aiAnalysis === 'object'
        ? (o.aiAnalysis as Problem['aiAnalysis'])
        : { ...DEFAULTS.aiAnalysis },
    fsrsCard: o.fsrsCard as Problem['fsrsCard'],
    createdAt: Number.isFinite(o.createdAt) ? (o.createdAt as number) : stamp,
    updatedAt: Number.isFinite(o.updatedAt) ? (o.updatedAt as number) : stamp,
  };
}

export function parseBackup(text: string, now = new Date()): ParsedBackup {
  /*
   * ========================================================================
   * 步骤1：解析并校验备份文件
   * ========================================================================
   * 数据源：用户选择的文件内容；操作：1) 整体校验 2) 逐条校验与去重
   */
  logger.info('开始解析备份文件');
  // 1.1 整体校验失败必须中止，不得改动任何数据
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('备份文件不是有效的 JSON。');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('这不是 AlgoRhythm 的备份文件。');
  const data = value as Record<string, unknown>;
  if (data.app !== BACKUP_APP_ID) throw new Error('这不是 AlgoRhythm 的备份文件。');
  if (data.schemaVersion !== BACKUP_SCHEMA_VERSION)
    throw new Error(
      `备份文件版本不受支持（版本 ${String(data.schemaVersion)}），请升级 AlgoRhythm 后再导入。`,
    );
  if (!Array.isArray(data.problems)) throw new Error('备份文件缺少题目列表，可能已损坏。');
  // 1.2 逐条校验；文件内重复 id 保留第一条
  const valid: Problem[] = [];
  const seen = new Set<string>();
  let invalidCount = 0;
  let duplicateInFileCount = 0;
  for (const raw of data.problems) {
    const item = normalize(raw, now);
    if (!item) {
      invalidCount += 1;
      continue;
    }
    if (seen.has(item.id)) {
      duplicateInFileCount += 1;
      continue;
    }
    seen.add(item.id);
    valid.push(item);
  }
  logger.info('备份文件解析完成');
  return { valid, invalidCount, duplicateInFileCount };
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/backup.ts tests/core.test.ts
git commit -m "feat: parse and validate backup files"
```

---

### Task 8: 事务写入（归属：Codex）

**Files:**
- Modify: `src/backup.ts`
- Modify: `tests/core.test.ts`

**Interfaces:**
- Consumes: Task 7 的 `parseBackup()`；`src/db.ts` 的 `db`
- Produces: `ImportMode`、`ImportOutcome`、`applyImport()`。Task 9 依赖它们。

- [ ] **Step 1: 写失败的测试**

```ts
describe('backup import', () => {
  async function seed(ids: string[]) {
    const database = new AlgoRhythmDB('imp-' + crypto.randomUUID());
    for (const id of ids) {
      await database.problems.put({ id, title: id, fsrsCard: { reps: 0 } } as never);
    }
    return database;
  }

  const incoming = (id: string, reps: number) =>
    ({ id, title: id, url: '', difficulty: 'medium', description: '', primaryPatternId: 'hash-map', secondaryPatternIds: [], aiAnalysis: { coreInsight: '', skeleton: '', prerequisites: [], warnings: [] }, fsrsCard: { reps }, createdAt: 1, updatedAt: 1 }) as never;

  it('skip mode only adds new ids', async () => {
    const database = await seed(['a']);
    const outcome = await applyImport([incoming('a', 9), incoming('b', 0)], new Set(['a']), 'skip', new Date(), database);
    expect(outcome).toEqual({ added: 1, overwritten: 0, skipped: 1 });
    expect((await database.problems.get('a'))!.fsrsCard.reps).toBe(0);
  });

  it('overwrite mode replaces existing records with the backup version', async () => {
    const database = await seed(['a']);
    const outcome = await applyImport([incoming('a', 9), incoming('b', 0)], new Set(['a']), 'overwrite', new Date(), database);
    expect(outcome).toEqual({ added: 1, overwritten: 1, skipped: 0 });
    expect((await database.problems.get('a'))!.fsrsCard.reps).toBe(9);
  });
});
```

> 注：为便于测试注入，`applyImport` 增加可选的第五个参数 `storage = db`，与 `src/db.ts` 里 `saveReview` 的做法一致。

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test`
Expected: FAIL —— `applyImport is not a function`。

- [ ] **Step 3: 写最小实现**

追加到 `src/backup.ts`（顶部补 `import { db } from './db';`）：

```ts
export type ImportMode = 'skip' | 'overwrite';

export interface ImportOutcome {
  added: number;
  overwritten: number;
  skipped: number;
}

export async function applyImport(
  incoming: Problem[],
  existingIds: Set<string>,
  mode: ImportMode,
  now = new Date(),
  storage = db,
): Promise<ImportOutcome> {
  /*
   * ========================================================================
   * 步骤1：把备份题目写入题库
   * ========================================================================
   * 目标表：problems；操作：1) 单事务写入 2) 统计新增/覆盖/跳过
   */
  logger.info('开始导入备份');
  const outcome: ImportOutcome = { added: 0, overwritten: 0, skipped: 0 };
  // 1.1 全程单事务，任一失败整体回滚
  await storage.transaction('rw', storage.problems, async () => {
    for (const item of incoming) {
      const exists = existingIds.has(item.id);
      if (exists && mode === 'skip') {
        outcome.skipped += 1;
        continue;
      }
      // 1.2 卡片原样使用备份里的值，不重新排期
      await storage.problems.put({ ...item, updatedAt: now.getTime() });
      if (exists) outcome.overwritten += 1;
      else outcome.added += 1;
    }
  });
  logger.info('备份导入完成');
  return outcome;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/backup.ts tests/core.test.ts
git commit -m "feat: apply backup import in a single transaction"
```

---

### Task 9: 题库页 UI（归属：Codex）

**Files:**
- Modify: `src/pages/ProblemsPage.tsx`

**Interfaces:**
- Consumes: Task 6–8 的 `buildBackup`、`downloadBackup`、`parseBackup`、`applyImport`、`ImportMode`
- Produces: 用户可见的「导出备份 / 导入备份」入口与预览弹窗。

- [ ] **Step 1: 接入导出按钮**

在页头「+ 导入题目」按钮旁加：

```tsx
<button className="secondary" onClick={handleExport}>导出备份</button>
<button className="secondary" onClick={handleImportClick}>导入备份</button>
<input ref={fileRef} type="file" accept="application/json" hidden onChange={handleFile} />
```

`handleExport` 用 `useLiveQuery` 已有的 `problems` 列表调用 `buildBackup` + `downloadBackup`，成功后 `setNotice(\`已导出 ${problems.length} 道题\`)`。

- [ ] **Step 2: 实现导入预览**

按规格附录 A.3 的文案表实现：预览弹窗标题 `导入预览`；正文 `备份中有 ${n} 道题。其中 ${a} 道是新的，${b} 道已存在。`；单选项 `跳过已存在的（只新增）`（默认）与 `覆盖已存在的（还原为备份版本）`；当 `b > 0` 时显示警告 `覆盖会把已存在题目的复习进度替换为备份里的版本，且无法撤销。`；按钮 `开始导入` / `取消`。

- [ ] **Step 3: 手动验证**

Run: `npm run dev`，在浏览器里导出一次、清空站点数据、再导入，确认题库恢复且每题的复习时间与导出前一致。

- [ ] **Step 4: 提交**

```bash
git add src/pages/ProblemsPage.tsx
git commit -m "feat: add backup export and import UI to problem library"
```

---

### Task 10: 端到端验收（归属：我）

**Files:**
- Modify: `docs/STATUS.md`（补齐 Task 4 留下的占位结论）

**Interfaces:**
- Consumes: Task 1–9 的全部产出
- Produces: 规格 §5 的 8 条验收标准的证据。

- [ ] **Step 1: 推分支，看 CI 是否在 PR 上跑起来**

Run: `git push`
Expected: PR #2 出现 `CI / lint / format / test / build` 检查项并变绿。

- [ ] **Step 2: 故意让 lint 失败，确认 CI 真的会红**

临时在任意 `src/*.ts` 里加一行 `const unused = 1;`，提交推送，观察 CI 变红；随后 `git revert` 掉那次提交并推送，确认恢复绿色。

> 这一步**不能跳过**。没有它，你无法确认安全网是通电的，还是只是一个摆设。

- [ ] **Step 3: 按规格 §5 逐条核对其余验收标准**

特别是第 2 条（导出→清空→导入→往返一致）与第 4 条（手改一份备份删掉某条 `id`，导入应跳过该条并报告）。把每条的**实际命令与结果**写进 `docs/STATUS.md`。

- [ ] **Step 4: 核对 Node 声明（验收第 8 条）**

Run: `git grep -n "22\.12" -- . ':(exclude)node_modules' ':(exclude)package-lock.json'`
Expected: 无匹配。

- [ ] **Step 5: 补齐 `docs/STATUS.md` 并提交**

```bash
git add docs/STATUS.md
git commit -m "docs: record slice 1 verification results"
```

- [x] **Step 6: 合并 —— 改为分两次合并（与初版计划不同，理由见下）**

初版计划写的是"Task 5–9 全做完后一次性合并"。执行后建议**改为两步**：

**6a. 先合并工程侧这一半（需要用户确认）**

```bash
gh pr merge 2 --repo harbinresearcher/algorhythm --squash --delete-branch
```

理由：**CI 只有在 main 上才有意义**。在合并之前，工作流只存在于 `feature/slice-1-design` 分支上，`main` 的任何提交都完全没有验证。而且本 PR 现在已是 10 个文件 / 1300+ 行（含规格与计划文档），再塞进备份功能会违反"PR 要小"。

**6b. 备份功能另开一个 PR**

在这条分支（或从合并后的 main 新建分支）上完成 Task 5–9，单独提 PR。这样备份功能会有**自己的 CI 运行**，验证更干净。

> 若用户坚持按原计划一次性合并，则跳过 6a，先完成 Task 5–9 再合并。

---

## 执行状态（2026-10-10）

| Task | 归属 | 状态 |
| --- | --- | --- |
| 1 CI 工作流 | 我 | ✅ 已完成，见 Step 2 证据 |
| 2 dependabot | 我 | ✅ 已完成，GitHub 格式校验 pass |
| 3 Node 版本修正 | 我 | ✅ 已完成，semver 复验 0 冲突 |
| 4 规则与进度修订 | 我 | ✅ 已完成 |
| 5–9 `src/` 备份实现 | Codex | ⬜ 未开始（等交接） |
| 10 验收 | 我 | 🔶 部分完成：Step 1/2/4/5 已做，Step 3 中依赖备份功能的条目待 Task 5–9 完成后补 |

**已完成的验证证据**：

- CI 在 PR #2 上首次运行，job `lint / format / test / build` 的 9 个步骤全部 success。
- **门禁有效性（lint）**：一次性分支 + 草稿 PR #3 故意引入未使用变量 → CI 精确地在 `Run npm run lint` 失败（run `38020663342`）。随后关闭 PR #3 并删除分支。
- **门禁有效性（test）**：本地放入一个必然失败的测试，`npm test` 退出码为 **1**，`npx vitest run` 亦为 **1**；移除后恢复 **0**。故 CI 的 test 步骤是真门。
  > 注意：用 `... | Select-Object -First N` 过滤输出会让管道提前终止，`$LASTEXITCODE` 失真为 0。必须先完整跑完并立刻取码，再筛输出。
- Node 版本：semver 逐个校验 124 个依赖，`22.13.0` 与 `24.0.0` 均 0 个不满足（修正前 `22.12.0` 有 10 个）。
