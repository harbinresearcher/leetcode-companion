# LCC 当前进度

更新日期：2026-10-09（Asia/Shanghai）。每次工作结束必须更新此文件；当前事实以此为准，未来计划见 [ROADMAP.md](ROADMAP.md)。

## 当前阶段

第一阶段 / P0：本地 MVP 功能已实现，模拟 AI 闭环已验证；真实 AI 分类验收尚未完成。MVP 基线 `ef78815` 已推送至私有仓库 main，仓库协作设施本轮已补齐。

## 已完成

- AI 设置保存到 localStorage，手动文本与可选链接导入。
- OpenAI 风格分析请求，固定 16 种模式，JSON/字段校验、超时与可见错误。
- IndexedDB 题库、模式筛选、完整题干与分析详情。
- 先独立回忆再揭示，FSRS 默认参数 + fuzz，事务评分与防重复点击。
- 深色桌面与移动布局，README 与三页运行截图。
- MIT、贡献指南、架构说明、长期路线图、Issue / PR 模板。
- ESLint、Prettier、编辑器和 Git 换行配置；Agent 的统一进度更新要求。

## 进行中

没有后台开发任务。真实 AI 验收等待用户配置自己的 Key；未开始第二阶段开发。

## 待开始

- 使用真实 API 导入一道题，确认分类与洞察质量。
- 是否启动模式化增强阶段，由用户决定。
- 有实际 PR 协作需求后再加 GitHub Actions。

## 本轮验证

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

## 下一步

用户在 AI 设置中填自己的 Key，然后导入一道真实题，检查标题、固定模式、洞察和骨架；刷新确认题库保留，再完成一次评分。记录服务、模型、结果与问题，但不记录 Key。

## 如何运行

Node.js 22.12+（22.x）、24.x 或 26+：

```sh
npm install
npm run dev
```

访问 http://127.0.0.1:5173。完整配置与命令见 [README](../README.md)，协作规则见 [CONTRIBUTING](../CONTRIBUTING.md)。
