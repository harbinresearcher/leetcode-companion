# 会话一：备份核心

你负责数据备份核心。总架构会话负责跨模块决策；不要负责界面或工程配置。先读 `docs/handoffs/00-COORDINATION.md`。

## 本轮交付

按附录 A.1、A.2、A.4 完成全部核心 API、类型清理和回归测试。API 可供界面会话直接接入，先提交可独立通过四项检查的核心版本。

## 允许修改的文件

- 新建 `src/backup.ts`。
- 修改 `src/types.ts`：只删除 notes、codeDrafts。
- 修改 `src/pages/ImportPage.tsx`：只删除构造 Problem 时对应两行。
- 修改 `tests/core.test.ts`：处理旧夹具中的死字段，新增核心备份测试。

其余文件归其他会话，不改。`src/db.ts` 可读并使用导出的 db，不改其行为。模块不依赖 React；导出与解析是纯处理，下载和事务导入有明确副作用，不把它们描述为纯函数。

## 接口契约

准确实现附录 A.1 的 BACKUP_APP_ID、BACKUP_SCHEMA_VERSION、BackupFile、buildBackup、backupFileName、downloadBackup、ParsedBackup、parseBackup、ImportMode、ImportOutcome、applyImport。参数、返回类型和错误文案不改名。

- buildBackup：只挑白名单，不导出设置；禁止直接 dump 原对象。
- backupFileName：本地时间，格式照抄。
- downloadBackup：释放 object URL，不写数据库。
- parseBackup：四类整体错误中止；坏条目、文件内重复分别计数；合法数据交给界面。
- applyImport：一个 Dexie 事务；新增用 add，明确允许覆盖时用 put；只改 updatedAt，不重新调度 FSRS。

## 工作步骤与验证

- [ ] 确认分支和干净状态，读实际 Card 类型及现有数据库测试。
- [ ] 先复现 00-COORDINATION 中日期、损坏卡片、嵌套敏感字段、过期 existingIds 的边界。给总架构提供最小反例与建议；有规格冲突的校验/写入行为待确认，不擅自改附录。
- [ ] 完成无歧义的白名单导出与下载。先写失败测试，再写最小实现。
- [ ] 删除死字段并同步调整现有测试夹具，保证旧测试仍通过。
- [ ] 实现解析与确认后的必要类型恢复，测试 JSON.stringify → parseBackup 的真实往返，不能直接把内存对象作为“导入”测试。
- [ ] 实现事务恢复，测试 skip/overwrite、新增失败回滚和 FSRS 原值保持。测试用 fake-indexeddb 与可清理的测试数据库，不调用用户浏览器。
- [ ] 运行四项质量检查，定向格式化自己的文件，提交并推送。
- [ ] 给界面会话交付 SHA 与 API 使用示例，给总架构交付证据和仍需决策的项。

## 测试必须证明

附录 A.4 的六类覆盖之外，还必须证明：日期恢复后 Date 索引与题库展示可用；备份不包含内嵌未知敏感字段；整个导入失败不残留半批数据。没有确认的边界只报告，不能写出与附录矛盾的默认规则。

## 工作区与不可越过的边界

- 仓库：`harbinresearcher/algorhythm`。本地：`D:\mydata\myproject\algorhythm`。
- 使用现有 `feature/slice-1-design`，不新建分支，不合并 PR #2，不更改仓库开关。
- 先读根目录 `AGENTS.md`、`CODEX-HANDOFF.md`、`docs/STATUS.md`、`docs/ROADMAP.md`，再读本任务引用的规格。
- 规格来源：`docs/superpowers/specs/2026-10-10-slice-1-ci-and-data-backup-design.md` 附录 A。函数签名、白名单、四类报错与 UI 文案照抄；本文件不另起一套协议。
- 不加依赖，不改 AI、FSRS、数据库现有行为、工程配置或规格。保留步骤块注释、子步骤注释与动作日志，不记录个人题干和密钥。
- 发现规格与运行安全冲突时，把复现条件、影响、最小建议交回总架构会话；不得静默选一种解释，也不靠类型断言或兜底新卡掩盖错误。
- 不用 `eslint-disable`、跳过测试或放宽 tsconfig 让检查变绿。

## 提交与交接

所有会话可能共用同一工作目录和 Git 暂存区。不要同时 checkout、pull、format 全仓、commit 或 push。仅格式化自己负责的文件，不暂存别人的改动，不执行 `git add .`。

写代码前确认其他会话是否正在提交。核心会话先完成并推送，界面会话再开始写代码；阶段交接必须给出提交 SHA。检查时若看到别人的未完成文件，不替别人改，不提交失败状态。

验证命令（PowerShell 中逐条运行，任一失败即停止提交）：

```sh
npm run lint
npm run format:check
npm test
npm run build
```

全部通过后只提交自己的文件，推送现有分支，回读 PR #2 对应 SHA 的 CI 结果。没有启动或未完成的检查不得记成通过。文档和 STATUS 由总架构会话统一更新；模块会话返回结果记录，不编辑公共进度文档。这是本轮对 AGENTS.md 更新进度要求的明确分工。

最终反馈：提交 SHA、修改文件、实际验证结果、未解决问题、交接给下个会话的接口。不要自行启动 P1/P2。
