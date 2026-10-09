# Agent 详细交接

更新日期：2026-10-09（Asia/Shanghai）。当前进度统一维护在 [STATUS.md](STATUS.md)，后续任务见 [ROADMAP.md](ROADMAP.md)。不要在本文件复制一份经常变化的进度表。

## 历史基线

- 项目已更名为 LCC (LeetCode Companion)，仓库名 leetcode-companion。
- 第一阶段源码、测试和五张运行截图包含在 ef78815，已于本轮推送 GitHub main。
- 原始方案保留在 phase-1-plan.md，实际修正见 implementation.md；以源码和当前 STATUS 为准，不盲目复制旧依赖命令。
- React 保持 18；Tailwind 最终采用 4 的 Vite 插件；Vitest 采用 5。
- IndexedDB 保留 Date；到期查询使用 fsrsCard.due 索引，评分在事务内校验快照。
- 分类默认值需显示警告，JSON 无法解析则不保存；真实 AI 质量尚未验收。

## 之前遇到的环境问题

受限 Codex 环境曾阻止原生 esbuild 扫描目录，允许 Node 文件访问；当时 node_modules 临时使用 esbuild-wasm，未提交到依赖声明。Git CLI 及 gh 登录也曾受限。本轮权限恢复后，Git 已能推送，npm 安装恢复了原生 esbuild，lint、测试和构建通过。

如果以后再次进入同类受限环境，可按需临时替换，不要把环境修复误当应用需求：

```sh
npm install --no-save --package-lock=false esbuild@npm:esbuild-wasm@0.25.12
```

缓存放工作区，必要时把 TEMP/TMP 指到工作区目录。Vite 已忽略 .tmp、.npm-cache、.browsers，避免监听锁定的浏览器文件。浏览器验证使用隔离 Chromium，未读取用户浏览器、密钥或题库。

## 接手顺序

1. 先读 STATUS.md 和 ROADMAP.md。
2. 查看 README、ARCHITECTURE.md、CONTRIBUTING.md 和 AGENTS.md。
3. 运行 lint、format:check、test、build，记录当前环境结果。
4. 完成授权范围后更新 STATUS.md，按 feat / fix / docs / chore 提交并推送。
5. 不重建已有项目，不把模拟响应写成真实模型验收，不擅自启动下一阶段。
