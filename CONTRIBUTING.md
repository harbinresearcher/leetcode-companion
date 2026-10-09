# 贡献指南

开始前先读 [当前进度](docs/STATUS.md)、[路线图](docs/ROADMAP.md) 和 [架构](docs/ARCHITECTURE.md)。Agent 还必须遵守 [AGENTS.md](AGENTS.md)。

## 开发环境

Node.js 22.12+（22.x）、24.x 或 26+，使用 npm。当前仓库私有，需要仓库访问权限。

```sh
git clone https://github.com/harbinresearcher/leetcode-companion.git
cd leetcode-companion
npm install && npm run dev
```

访问 http://127.0.0.1:5173。已有 lockfile，重复安装和验证建议用 `npm ci`；不要提交 node_modules、Key 或个人浏览器数据库。

## 分支策略

- `main`：可运行的基线，第一阶段已交付功能。
- `feature/<简短描述>`：从最新 main 创建，完成单一功能或修复后通过 PR 合入。
- `dev`：多人协作需要集成分支时再引入；目前不创建长期 dev 分支，避免两条基线漂移。

Agent 的明确授权直接提交例外，以当前任务指令为准。不要覆盖他人未提交内容，不强制推送共享分支。

## 代码规范

ESLint 检查 TypeScript 和 Hooks 调用位置；Prettier 统一缩进、引号和换行。使用当前 flat config `eslint.config.js`，不添加旧式 `.eslintrc.cjs`。

```sh
npm run lint
npm run format
npm run format:check
npm test
npm run build
```

- 只修改任务所需内容，类型清晰，不用 any 掩盖边界错误。
- 核心逻辑不依赖 React，UI 不直接编写排期算法。
- 主要逻辑使用现有步骤块注释、子步骤注释和开始/结束 logger.info。日志只记录动作，不含 Key、请求头或题目全文。
- 新功能或修复先定义验收方式；行为改动需相应测试，纯文档改动检查链接与事实即可。
- UI 改动检查桌面和移动尺寸；截图不得包含密钥或个人题库。
- 固定 16 种模式，FSRS 默认参数 + fuzz；路线图未授权功能不得自行实现。

## 提交信息

采用 `类型: 简短说明`，例如：

```text
feat: add pattern filter
fix: prevent duplicate review ratings
docs: update MVP status
chore: configure lint and formatting
```

每次结束必须更新 docs/STATUS.md，写明已完成内容、验证结果、已知问题和下一步。仅在需要保留详细交接背景时更新 docs/HANDOFF.md。

## PR 流程

1. 先读 STATUS 和 ROADMAP；新功能先确认范围，Bug 提供复现步骤。
2. 创建短期 feature 分支，保持单一目的。
3. 运行 lint、format:check、test、build，记录实际结果；UI 改动附截图。
4. 填写 PR 模板，说明问题、改动、验证方式和关联 Issue。
5. 根据评审修改后重复受影响检查，再合入 main。

MVP 阶段手动验证，暂不启用 GitHub Actions。测试替身只能证明交互与数据流程，不能当作真实 AI 分类验收。许可证为 MIT，提交前确认新增代码和素材允许以此方式分发。
