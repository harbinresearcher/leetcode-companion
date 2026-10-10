# 切片 1 设计：CI 安全网 + 数据备份

- 日期：2026-10-10
- 仓库：`harbinresearcher/algorhythm`
- 上游依据：对标与优化报告（仓库外文件：`D:\mydata\myproject\algorhythm-对标与优化报告.md`，本规格引用其 §4 P0 清单与附录 A）
- 状态：待评审

## 1. 背景与动机

AlgoRhythm 目前没有任何自动化质量保证：`lint` / `format:check` / `test` / `build` 全靠手动执行，忘一次坏代码就进 main。同时题库只存在浏览器 IndexedDB 里，**清一次站点数据就全部归零**——2026-10-10 的更名操作已经真实触发过一次数据不可读。

这两件事分别对应「工程安全网」与「产品兜底」，是本切片要解决的全部问题。

## 2. 目标与非目标

### 目标

1. 建立 CI，让 `main` 的每一次改动都经过自动验证。
2. 让用户可以把题库导出成文件、再从文件恢复。
3. 推翻 `AGENTS.md` 中"MVP 暂不添加 GitHub Actions"的规则（用户已明确授权）。

### 非目标（明确不做）

- ❌ 不引入任何后端、账号或云同步。
- ❌ 不引入新运行时依赖（导出导入用浏览器原生 API 实现）。
- ❌ 不建 IndexedDB schema 迁移机制——当前没有任何 schema 变更，加了就是空转代码（YAGNI）。本次只把 `schemaVersion` 写进导出文件，为将来的迁移留依据。
- ❌ 不做自动定时备份、不做备份提醒。
- ❌ 不改 AI 相关代码。

## 3. 交付物

| # | 文件 | 动作 |
| --- | --- | --- |
| 1 | `.github/workflows/ci.yml` | 新增 |
| 2 | `.github/dependabot.yml` | 新增 |
| 3 | `src/backup.ts` | 新增（导出/导入的纯逻辑，不依赖 React） |
| 4 | `src/pages/ProblemsPage.tsx` | 修改（加导出/导入按钮与预览弹窗） |
| 5 | `src/types.ts`、`src/pages/ImportPage.tsx` | 修改（删除死字段） |
| 6 | `tests/core.test.ts` | 修改（新增导出导入测试） |
| 7 | `AGENTS.md`、`docs/ROADMAP.md`、`docs/STATUS.md` | 修改（规则与进度） |
| 8 | 远端分支 `fix/import-link-feedback` | 删除 |

## 4. 详细设计

### 4.1 CI（`.github/workflows/ci.yml`）

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

**设计取舍**：

- 单 job 串行。本地实测四个命令合计约 3 秒，拆 job 只会让总耗时变长（tldraw `checks.yml` 同样是单 job）。
- Node 固定 `24`。excalidraw / tldraw / cal.com 三家都没有 `.nvmrc`，都用 `engines` 字段；本地是 Node 26，CI 用当前 LTS 24。
- **已知坑（记录在案）**：`paths-ignore` 会让纯文档 PR 跳过本工作流。将来若把 CI 设为分支保护的 required check，这类 PR 会因"等不到检查"而无法合并。届时的解法是去掉 `paths-ignore` 或改为 job 级 `if`。当前未设 required check，不受影响。

### 4.2 依赖自动化（`.github/dependabot.yml`）

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

`groups` 是关键：没有它，Dependabot 一周可能开出十几个 PR。

### 4.3 数据导出

**文件格式**（`schemaVersion` 是核心字段）：

```jsonc
{
  "schemaVersion": 1,
  "app": "algorhythm",
  "exportedAt": "2026-10-10T03:20:00.000Z",
  "count": 3,
  "problems": [ /* Problem[] */ ]
}
```

**字段白名单**：导出时**逐字段挑选**，不直接序列化 `Problem` 对象。理由有二——(a) 死字段与将来的临时字段不会漏进备份文件；(b) 万一以后给 `Problem` 加了敏感字段，不会因为一次"顺手 dump"而写进用户要分享的文件。

导出白名单：`id`、`title`、`url`、`difficulty`、`description`、`primaryPatternId`、`secondaryPatternIds`、`aiAnalysis`、`fsrsCard`、`createdAt`、`updatedAt`。

**API Key 不导出**——它存在 `localStorage` 的 `algorhythm.ai.v1`，与题库分离，本就不在导出范围内。UI 上明确写出这一点。

**文件名**：`algorhythm-backup-YYYYMMDD-HHmm.json`

**实现**：`JSON.stringify` → `Blob` → `URL.createObjectURL` → `<a download>`，用完 `URL.revokeObjectURL`。

### 4.4 数据导入

流程：

1. 用户选择文件 → 读取文本 → `JSON.parse`（失败即报错，不改动任何数据）。
2. **整体校验**：`app === 'algorhythm'`；`schemaVersion` 为已知版本（当前只接受 `1`）；`problems` 是数组。任一项不满足 → 明确报错并中止。
3. **逐条校验**：每条必须含 `id`（字符串）、`title`（字符串）、`fsrsCard`（对象）。不合法的条目跳过并计数，**不因个别坏数据而整体失败**。同一条备份内若出现重复 `id`，保留第一条，后续重复项计入忽略数。
4. **比对本地**：按 `id` 与现有题库比对，得出「新增 N 题 / 已存在 M 题」。
5. **预览弹窗**：显示 N 与 M，让用户选择：
   - 「跳过已存在的（只新增）」——默认
   - 「覆盖已存在的（还原为备份版本）」
   若 M = 0 则不显示选择，直接说明只会新增。
6. **事务写入**：整个导入在一个 Dexie 事务内完成，失败则回滚。
7. **结果反馈**：`新增 N 题，覆盖 M 题，跳过 K 题，忽略 L 条无效数据`。

**为什么给预览而不是直接合并**：覆盖复习进度是不可逆的。宁可多一次点击，也不要让用户在不知情的情况下丢掉 FSRS 历史。

### 4.5 死字段清理

`Problem` 接口中的 `notes` 与 `codeDrafts` 从未被任何代码读写，删除：

- `src/types.ts`：删除两个字段声明。
- `src/pages/ImportPage.tsx`：删除构造 `Problem` 时的 `notes: ''` 与 `codeDrafts: {}`。
- 无需数据迁移：Dexie 中已有记录的多余字段会被读取方忽略；导出使用白名单，也不会带出。

若将来要做「自己写解法草稿」，再重新设计该字段并加 `schemaVersion` 迁移。

### 4.6 规则修订

`AGENTS.md` 中：

- 原文：`MVP 暂不添加 GitHub Actions。`
- 改为：`提交前必须运行 npm run lint、npm run format:check、npm test、npm run build；CI 会验证这四项，PR 必须全绿才能合并。`

`docs/ROADMAP.md` 中勾掉「有实际 PR 协作需求后增加 GitHub Actions（lint + test + build）」。

## 5. 验收标准

1. **CI 真的通电**：新建一个 PR，故意引入一处 lint 错误，确认 CI 变红；修好后确认变绿。
2. **往返一致**：导出 → 清空 IndexedDB → 导入 → 题库数量、每题的 `fsrsCard`（`due` / `reps` / `stability` 等）、`primaryPatternId` 与导出前一致。
3. **冲突策略生效**：对同一份备份导入两次，第二次在「跳过」模式下应报告全部跳过且题库不变；在「覆盖」模式下应报告全部覆盖。
4. **坏数据不炸**：手改一份备份，把某条题目的 `id` 删掉，导入应跳过该条并在结果中报告，其余正常导入。
5. **拒绝非本应用文件**：导入一个普通 JSON（如 `package.json`）应明确报错，且题库不变。
6. `npm run lint`、`npm run format:check`、`npm test`、`npm run build` 全部通过。
7. 新增测试覆盖：导出结构（含 `schemaVersion`）、导入整体校验、逐条校验、两种冲突策略。

## 6. 风险与回滚

| 风险 | 缓解 |
| --- | --- |
| CI 首次运行因 Node 版本差异失败（本地 Node 26，CI Node 24） | 失败时按报错调整；必要时改用 matrix `[22, 24]` |
| 用户在「覆盖」模式下误操作丢失复习进度 | 预览弹窗默认选中「跳过」；文案写明覆盖会替换 FSRS 历史 |
| 导入写入过程中失败导致半写入 | 全程单事务，失败自动回滚 |
| 未来设 required check 与 `paths-ignore` 冲突 | 已记录在 §4.1，届时二选一调整 |

回滚方式：本切片的产出都是新增文件与局部修改，`git revert` 单个合并提交即可；导出功能不改变既有数据，导入功能只在用户主动触发时执行。

## 7. 测试计划

- **单元测试**（`tests/core.test.ts`，沿用现有 fake-indexeddb 环境）：
  - 导出对象包含 `schemaVersion: 1`、`app`、`count` 正确，且**不含** `notes` / `codeDrafts`。
  - 导入：拒绝非 JSON、拒绝 `app` 不符、拒绝未知 `schemaVersion`。
  - 导入：逐条校验跳过坏数据并正确计数。
  - 导入：`skip` 与 `overwrite` 两种策略下的题库状态正确。
- **手动验证**：用 `npm run dev` 在浏览器里完整走一遍导出→导入。
- **CI 验证**：见 §5 第 1 条。

## 8. 未决问题

无。本规格中所有需要决策的点均已确定：

- 冲突策略 → 预览后由用户选择（默认跳过）
- 死字段 → 删除
- CI 触发范围 → path 过滤，不跑纯文档改动
- Node 版本 → 固定 24
