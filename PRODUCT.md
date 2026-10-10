# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

准备算法学习与实习面试的个人使用者。主要任务是理解解题模式，并通过独立回忆与间隔复习保留解法。

## Product Purpose

AlgoRhythm 将题目归入受控的 16 种模式，保存题干、洞察和复习卡片。学习闭环为导入、题库回看、独立尝试、揭示分析和评分。

## Operating Context

纯前端、本地浏览器应用。React 18、TypeScript、Vite、Tailwind、Dexie 和 ts-fsrs；确切依赖版本以 lockfile 为准。题库存在 IndexedDB，AI 配置在 localStorage。

## Capabilities and Constraints

支持文本或公开链接导入、模式筛选、题干与分析展开、题目删除、FSRS 评分和 JSON 备份恢复。备份不含 API Key，确认前不写库，默认跳过冲突，覆盖明确警告且不可撤销。恢复保留备份卡片，不重新排期。

没有后端、账号、云同步、编辑器、热力图、掌握度统计或面试模拟。真实 AI 调用需要用户配置服务；模拟浏览器验收不代表真实模型质量。

## Brand Commitments

当前产品名 AlgoRhythm。2026-10-10 用户明确授权整站视觉重设计；此次授权覆盖导航、导入、题库、复习和设置的表现，不增加业务功能。历史交接的单页视觉边界不适用于这一轮已授权重设计。

## Evidence on Hand

产品与业务契约来自 FRONTEND-HANDOFF.md、README.md、docs/ARCHITECTURE.md 和备份规格附录 A。截图与浏览器验收使用合成题库；没有 Figma 设计稿，也没有本轮真实 AI 验收。

## Product Principles

- 阅读题干和代码优先于装饰。
- 先独立回忆，再揭示分析。
- 导入和恢复成功以实际写入结果为准。
- 数据删除与覆盖须有明确确认。

## Accessibility & Inclusion

最低检查桌面 1360×900、手机 390×844 和 320px 窄屏。使用语义控件、可见焦点、原生模态焦点约束、关闭后焦点恢复和减少动态效果偏好。不宣称通过完整 WCAG 认证。
