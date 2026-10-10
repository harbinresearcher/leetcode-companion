# DSH 小任务队列

日期：2026-10-10。此文件只登记发现，不自动派发。用户把具体条目交给 DSH 后才动手。DSH 不改 src/ 或 tests/，不替模块会话解决业务逻辑。与总架构协调文档所有权，避免并发提交。

## 已发现，可单独领取

### DSH-01：修正公共进度中的 CI 自相矛盾

- 证据：STATUS 已记录 CI 首次通过，但“已知问题与边界”仍写“仓库尚无 lint / test / build 的 CI，PR 的状态检查为空”。
- 文件：仅 docs/STATUS.md。
- 动作：将过时表述改成“CI 已启用；required check 尚未由用户决定”。保留历史验证记录，不重写全文。
- 验收：与 PR #2 最新检查回读一致，不能把非 required 说成 required。

### DSH-02：修正文档中链接读取的架构说明

- 证据：ARCHITECTURE 首段写“只有题目分析调用外部 AI”，但 source.ts 实际另调用 Jina Reader；AGENTS 仍笼统禁止“抓取”，与用户已授权链接读取冲突。
- 文件：docs/ARCHITECTURE.md、AGENTS.md。
- 动作：只澄清现有 Reader 链路获授权，不扩展爬虫、多平台同步或后台服务。说明链接发往 Reader，题干发往配置的 AI。
- 验收：规则与实际 source.ts 一致，不增加依赖、不改产品行为。

### DSH-03：备份完成后同步进度、路线图和使用说明

- 依赖：核心和界面验收完成，先取得总架构证据。
- 文件：docs/STATUS.md、docs/ROADMAP.md、README.md，必要时 CHANGELOG.md。
- 动作：补导出/恢复说明，勾掉备份待办，更新“没有导出”边界。截图使用隔离测试数据。
- 验收：未通过的真实浏览器测试保留为未验证，不提前将计划勾成完成。

## 发现但不能当杂活处理

- 日期恢复、损坏卡片校验、嵌套白名单、预览与写入之间的数据变化：归核心会话和总架构。
- PR #2 是否合并、delete_branch_on_merge、allow_auto_merge、CI 是否 required、是否加严 ESLint/tsconfig：归用户决定，不领取、不自行改。
- CI 使用 paths-ignore。若将来设置 required check，纯文档改动可能不触发检查。当前只登记；用户决定设置 required 后再按规格 §4.1 处理。
- 真实链接读取和模型质量仍未验收，不靠模拟测试关闭该问题。

每项回报应包含：改动、验证证据、提交 SHA、是否留下待决问题。不得合并 PR #2。
