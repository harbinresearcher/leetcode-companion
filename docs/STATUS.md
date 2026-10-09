# LCC 当前进度

更新日期：2026-10-09（Asia/Shanghai）。每次工作结束必须更新此文件；当前事实以此为准，未来计划见 [ROADMAP.md](ROADMAP.md)。

## 当前阶段

第一阶段 / P0：本地 MVP 功能已实现，模拟 AI 闭环已验证；真实 AI 分类验收尚未完成。仓库已公开（MIT），`main` 已启用分支保护；本轮完成公开仓库的安全加固与社区健康文件。

## 已完成

- AI 设置保存到 localStorage，手动文本与可选链接导入。
- OpenAI 风格分析请求，固定 16 种模式，JSON/字段校验、超时与可见错误。
- IndexedDB 题库、模式筛选、完整题干与分析详情。
- 先独立回忆再揭示，FSRS 默认参数 + fuzz，事务评分与防重复点击。
- 深色桌面与移动布局，README 与三页运行截图。
- MIT、贡献指南、架构说明、长期路线图、Issue / PR 模板。
- ESLint、Prettier、编辑器和 Git 换行配置；Agent 的统一进度更新要求。
- 公开仓库后的安全加固：密钥扫描、推送保护、Dependabot 告警与安全更新、CodeQL 默认代码扫描、GitHub 私有漏洞报告。
- 社区健康文件：SECURITY.md、CODE_OF_CONDUCT.md、SUPPORT.md、CHANGELOG.md、`.github/CODEOWNERS`。
- README 增加徽章与「贡献与支持」入口，并修正“仓库私有”“暂不启用 CI”等过时表述；CONTRIBUTING 补充分支保护、推送保护与社区规范。
- `main` 分支保护：要求 PR 合入、禁止强推与删除分支，仓库所有者保留应急旁路。
- 仓库描述、16 个话题标签、GitHub Discussions（含 Q&A 分类）与社交预览图素材。

## 进行中

没有后台开发任务。真实 AI 验收等待用户配置自己的 Key；未开始第二阶段开发。

## 待开始

- 使用真实 API 导入一道题，确认分类与洞察质量。
- 是否启动模式化增强阶段，由用户决定。
- 有实际 PR 协作需求后再加 GitHub Actions（lint + test + build）。
- 手动上传社交预览图：Settings → General → Social preview，素材见 `docs/assets/social-preview.png`。
- 手动确认 Settings → Advanced Security 中的 validity checks 与 non-provider patterns（API 无法开启）。

## 本轮验证

仓库公开与安全配置轮（2026-10-09）：

- `gh api` 回读：密钥扫描、推送保护、Dependabot 告警与安全更新、私有漏洞报告均为 enabled。
- CodeQL 默认代码扫描：`CodeQL Setup` 工作流 completed/success，语言 javascript、javascript-typescript、typescript，每周调度。
- 全历史密钥扫描：4 次提交的全部 blob 匹配 `sk-`、`ghp_`、`gho_`、`github_pat_`、`AIza`、`xox[baprs]-`、私钥头与 `AKIA`，以及凭据赋值模式，均无命中。
- 分支保护：回读 required_pr=true、approvals=0、enforce_admins=false、allow_force_pushes=false、allow_deletions=false。
- 仓库描述、16 个话题标签、Discussions 启用状态与 Q&A 分类：回读一致。
- 文档相对链接：9 个文件、49 个相对链接全部有效。
- npm run lint、npm run format:check、npm test（12 项）、npm run build：全部通过。本轮只改文档、CODEOWNERS 与预览图素材，未触碰 src 与 tests。
- 社交预览图：`docs/assets/social-preview.png`，1280×640，由 `docs/assets/make_social_preview.py` 生成，配色取自 `src/index.css`。

功能开发轮（上一轮）：

- npm run lint：通过，无警告。
- npm run format:check：通过。
- npm test：12 项通过。
- npm run build：TypeScript 与 Vite 构建通过。
- git diff --check：通过。
- 干净目录 npm ci：成功；随后 lint、format:check、12 项测试和 build 全部通过，依赖审计为零已知漏洞。
- 新增 lint 发现两处重抛错误未保留 cause，已修复；用户看到的错误文字未改变。
- 上一轮开发服务器与生产预览的浏览器验证通过，包括持久化、错误恢复、隐藏答案、评分、移动布局与删除；截图为模拟 AI 响应。

## 已知问题与边界

- 没有真实模型验收结果，模拟响应只能证明流程。
- 清除站点数据会丢失题库，目前没有导出或云同步。
- API Key 未加密，保存在此浏览器 localStorage。
- Base URL 对应服务需支持浏览器跨域请求和 JSON 输出。
- 非法主要模式有分类待确认警告；兜底标签不是可信 AI 结论。
- FSRS 的“忘了”可能几分钟后再次到期，不意味着当天永远移出到期列表。
- 之前的受限环境曾导致 Git 登录与 esbuild 扫描失败；当前权限已恢复，GitHub MVP 同步与原生依赖构建均已成功。
- CodeQL 首次扫描产出 1 条告警：`js/clear-text-storage-of-sensitive-data`（high，`src/ai.ts:200`），即 API Key 明文存入 localStorage。已按「已接受的风险（won't fix）」关闭，理由指向本文件的边界说明与 SECURITY.md；不是待修复缺陷。
- 密钥扫描的 `secret_scanning_validity_checks` 与 `secret_scanning_non_provider_patterns` 通过 REST API 无法开启（PATCH 被静默忽略），需在 Settings → Advanced Security 界面确认；不影响主密钥扫描与推送保护。
- 社交预览图没有 API，只能人工上传。
- 分支保护要求 PR 且审批数为 0：这是 solo 仓库的必要选择，否则维护者无法批准自己的 PR，PR 将永远无法合并。
- Actions 的 `allowed_actions` 保持默认 `all`（避免拦住第三方 action）；`default_workflow_permissions` 已是只读，`fork-pr-contributor-approval` 为 `first_time_contributors`。
- 仓库尚无 lint / test / build 的 CI，PR 的状态检查为空。

## 下一步

用户在 AI 设置中填自己的 Key，然后导入一道真实题，检查标题、固定模式、洞察和骨架；刷新确认题库保留，再完成一次评分。记录服务、模型、结果与问题，但不记录 Key。

另外两件需要人工在 GitHub 界面完成的事：上传社交预览图（Settings → General → Social preview，素材已生成）；确认 Advanced Security 里 validity checks 与 non-provider patterns 的开闭状态。

## 如何运行

Node.js 22.12+（22.x）、24.x 或 26+：

```sh
npm install
npm run dev
```

访问 http://127.0.0.1:5173。完整配置与命令见 [README](../README.md)，协作规则见 [CONTRIBUTING](../CONTRIBUTING.md)。
