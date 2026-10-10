# Codex 接手说明 · 切片 1「数据备份」

> 生成：2026-10-10 ｜ 生成者：DSH（负责工程配置与验收）
> **详细施工简报**在规格的**附录 A**：`docs/superpowers/specs/2026-10-10-slice-1-ci-and-data-backup-design.md`

## 一句话任务

给纯前端算法刷题应用加**题库导出/导入备份**。只动 `src/`。

## 当前状态

- 仓库 `harbinresearcher/algorhythm`，本地 `D:\mydata\myproject\algorhythm`
- 工作分支 **`feature/slice-1-design`**（已存在，切过去继续，**不要新建分支**）
- CI 已就位：`.github/workflows/ci.yml`，PR 上跑 lint / format:check / test / build
- 已有 PR **#2**（工程侧那半已完成、检查全绿）

## 你要做的 5 个文件

| 文件 | 动作 |
| --- | --- |
| `src/backup.ts` | 新建：导出/导入的全部纯逻辑 |
| `src/types.ts` | 删除死字段 `notes`、`codeDrafts` |
| `src/pages/ImportPage.tsx` | 删除构造 Problem 时的 `notes: ''`、`codeDrafts: {}` |
| `src/pages/ProblemsPage.tsx` | 加「导出备份 / 导入备份」按钮 + 预览弹窗 |
| `tests/core.test.ts` | 追加备份相关测试 |

## 不要做

- 不改 `.github/`、`package.json`、`AGENTS.md` 及任何文档
- 不引入任何新依赖（浏览器原生 API 够用）
- 不改 `src/ai.ts`、`src/fsrs.ts`、`src/db.ts` 的现有行为
- 不顺手重构无关文件
- 不自行更改导出格式的字段名

## 必须一字不差的部分

函数签名、导出字段白名单、逐条校验规则、四类报错原文、10 条 UI 文案 —— **全在规格附录 A.1 与 A.3**，照抄，不要自己发挥。

> 原因：含糊的地方编码 Agent 会自己编一个答案，而它编的未必是想要的。

## 验收

```sh
npm run lint && npm run format:check && npm test && npm run build
```

四项全绿才算完成。**CI 也会跑这四项**；红了不要用 `eslint-disable`、放宽 tsconfig 或跳过测试来绕过——修到真通过。

## 完成后

1. 提交（信息前缀用 `feat:` / `fix:` / `chore:`）
2. `git push` 到 `feature/slice-1-design`，PR #2 会自动更新
3. 确认 PR #2 的 `lint / format / test / build` 变绿

## 不需要你决定的事

由用户决定，别自行处理：PR #2 是否合并、仓库开关、CI 是否设为 required check、是否收紧 ESLint/tsconfig。
