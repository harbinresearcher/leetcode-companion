# 变更日志

本文件记录 AlgoRhythm 的显著变更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 变更

- **项目更名为 AlgoRhythm**（Algorithm + Rhythm）。仓库名由 `leetcode-companion` 改为 `algorhythm`，旧地址由 GitHub 自动跳转。
- 应用品牌标识（`[c] LeetCode Companion` → `[ar] AlgoRhythm`）、`package.json` 包名、页面标题、日志前缀与全部文档同步更新。
- 内部存储标识一并更名：IndexedDB 库名 `leetcode-companion` → `algorhythm`，localStorage 键 `companion.ai.v1` → `algorhythm.ai.v1`。**这会导致旧数据不被读取**：需要重新填写 AI 设置，此前导入的本地题库也不会再出现在界面中（浏览器里仍留有旧库，但当前版本不读取）。
- 运行截图按新品牌重新生成。
- `docs/phase-1-plan.md` 保留成文时的旧名并标注为历史存档。

### 计划中

- 用真实 AI 服务完成一道题的分类与洞察质量验收，见 [docs/ROADMAP.md](docs/ROADMAP.md)。
- 有实际 PR 协作需求后增加 GitHub Actions（lint + test + build）。

## [0.1.0] - 2026-10-09

第一阶段 / P0 本地 MVP 的首个版本。

### 新增

- 纯前端本地 Web 应用：Vite 6 + React 18 + TypeScript 5 + Tailwind CSS 4。
- 手动粘贴题干与可选原题链接导入；不自动抓取页面。
- OpenAI 风格 `/chat/completions` 分析请求，Base URL 与 Model 可配置（默认 DeepSeek `deepseek-chat`）。
- 固定 16 种算法模式；AI 返回的 JSON 与字段校验、缺失字段默认值、可见错误提示。
- IndexedDB（Dexie）本地题库，按主要/次要模式筛选与详情展开。
- 先独立回忆、再揭示洞察与代码骨架的复习流程。
- 基于 ts-fsrs 的默认参数 + fuzz 排期，事务化评分与防重复点击。
- 深色主题的桌面与移动端布局。
- 核心测试（AI 边界、IndexedDB、FSRS 一致性）、ESLint 与 Prettier 配置。
- 文档：README 与运行截图、架构说明、进度与路线图、项目背景、实现记录、Agent 协作约束。
- 协作设施：MIT 许可证、贡献指南、Issue / PR 模板、编辑器与 Git 换行配置。

### 安全

- 仓库公开，并启用 GitHub 密钥扫描、推送保护、Dependabot 告警与安全更新、CodeQL 默认代码扫描。
- 增加 [SECURITY.md](SECURITY.md) 安全报告渠道，启用 GitHub 私有漏洞报告。
- 入口社区文件：[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)、[SUPPORT.md](SUPPORT.md)、[CONTRIBUTING.md](CONTRIBUTING.md)。

### 已知限制

- API Key 明文保存在浏览器 `localStorage`，未加密。
- 清除站点数据会丢失题库；没有云同步与导出。
- 真实 AI 分类质量尚未验收，截图中的分类结果来自模拟响应。
