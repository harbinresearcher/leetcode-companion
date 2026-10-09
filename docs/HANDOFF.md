# Agent 交接记录

更新日期：2026-10-09（Asia/Shanghai）

## 已完成

- 项目名称：LeetCode Companion；私有远程：harbinresearcher/leetcode-companion。
- 实现 AI 设置、文本导入、固定模式分类、Dexie 题库、筛选和详情、FSRS 复习。
- AI 非法 JSON 不入库；缺失字段有默认值和警告；网络、HTTP、超时有可见错误。
- 复习前隐藏模式和答案，完整展示题干；评分成功后推进本轮队列，事务与同步锁防重复评分。
- 深色桌面与移动布局；截图位于 docs/screenshots，README 已补启动与使用说明。

## 验证证据

- npm test：12 项核心测试通过，使用 Vitest 5.0.3。
- npm run build：TypeScript 与 Vite 生产构建通过。
- npm run dev：固定端口 5173 启动，并完成开发服务器浏览器闭环验证。
- npm audit（官方 npm registry）：含开发依赖，0 vulnerabilities，仅反映当前已发布公告。
- 生产预览和开发服务器均通过浏览器验证：配置持久化、401 恢复、非法 JSON 恢复、导入、主要模式筛选、刷新保留、Date 往返、隐藏提示、重复点击只评分一次、到期时间保存、移动端无横向溢出、删除取消/确认。
- 使用隔离 Chromium 和模拟 AI 响应；未调用真实付费模型，未读取用户 Key。

## 与原方案的差异

React 保持 18；Tailwind 使用 4 的 Vite 插件；Vitest 升到 5。原版本的依赖审计发现已知漏洞，新版本已重新构建和验证。FSRS 保持默认参数 + enable_fuzz。详见 docs/implementation.md。

原始阶段方案保留为历史参考，当前 README、实现记录与源码描述最终行为。非法主要模式的结构兜底标签不能当作可信分类。

## 当前环境限制

当前 Codex 限制下，原生 esbuild 子进程不能向上扫描目录，Node 文件访问正常。此环境的 node_modules 临时使用兼容的 esbuild-wasm；替换未写入 package.json 或 lockfile，普通安装仍使用原生 esbuild。类似受限环境可运行：

```sh
npm install --no-save --package-lock=false esbuild@npm:esbuild-wasm@0.25.12
```

在受限终端中把 TEMP/TMP 指向工作区目录。浏览器验证还使用工作区缓存；Vite 已忽略这些临时目录，避免监听锁定的 Cookie 文件。Playwright CLI 守护进程在此环境退出，因此改用同一进程内的 Playwright Chromium 验证，没有改用测试替身渲染截图。

Git CLI 无法启动 D 盘二进制，gh 也无法读取原登录凭据。GitHub 插件能识别用户，但访问私有仓库返回 404。用户已收到授权仓库访问或恢复原环境权限的请求。远程同步受阻，不能把本地代码说成已推送。

## 尚未完成的验收

- 使用用户自己的 API Key 调用真实服务，确认真实题目分类质量；模拟响应不能代替。
- GitHub 访问恢复后，同步源码、lockfile、文档和截图并核对远程提交。

## 下一位 Agent

1. 不要重建项目，先检查已有源码与本地提交。
2. 恢复访问后推送完整交付，不只提交文档。
3. 用用户自己的 Key 验证真实分类，Key 只在本地表单输入。
4. 第一阶段验收后再讨论后续功能，不擅自开始 P1/P2。
