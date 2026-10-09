# LeetCode Companion

把刷题变成刷模式。纯前端、本地运行的算法学习辅助工具。

## 当前状态

仓库已建立，项目背景和第一阶段执行方案已归档。尚未初始化应用，不能运行 `npm run dev`。

## Agent 接手入口

1. 阅读 [项目决策](docs/project-context.md)。
2. 阅读 [第一阶段执行方案](docs/phase-1-plan.md)，包含 16 种模式和初版 Prompt。
3. 阅读 [交接记录](docs/HANDOFF.md)，确认已完成项和下一步。
4. 按 [协作约束](AGENTS.md) 开发，每次交接更新记录并提交代码。

## MVP

手动粘贴题目文本与链接 → OpenAI 兼容 API 分析 → IndexedDB 保存 → 按模式浏览 → FSRS 复习评分。

技术栈：Vite、React 18、TypeScript、Tailwind CSS、Dexie、dexie-react-hooks、ts-fsrs。

第一阶段不做后端、账号、链接抓取、浏览器扩展、代码编辑器、掌握度图表或面试模式。

应用完成后补充安装步骤、AI 配置说明与运行截图。许可证尚未选择。
