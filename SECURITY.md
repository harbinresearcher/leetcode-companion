# 安全策略

LCC（LeetCode Companion）是纯前端、本地运行的算法学习工具：没有后端、没有账号，也不收集用户数据。仓库里不保存任何用户凭据。

我们欢迎安全研究，但**请不要用公开 Issue 报告安全问题**——公开 Issue 会立刻把细节暴露给所有人，包括可能的利用者。

## 支持范围

| 版本 | 是否接受安全修复 |
| --- | --- |
| `main` 与 0.1.x | 是 |
| 更早的提交或已废弃分支 | 否，请先确认问题在当前 `main` 上仍可复现 |

这是一个个人维护的学习项目，尚未承诺长期维护窗口。

## 报告漏洞

使用 GitHub 的私有漏洞报告渠道：

1. 打开仓库的 [Security 标签页](https://github.com/harbinresearcher/leetcode-companion/security)。
2. 点击 **Report a vulnerability**。
3. 填写报告。

该渠道只有维护者可见，我们可以在其中私下沟通、确认修复并协商公开时间。

如果无法使用该渠道，请在 Issue 中**只**写“我需要私密报告一个安全问题”，不要包含任何技术细节，我们会回复并提供后续渠道。

### 报告中请包含

- 问题类型（例如 XSS、依赖漏洞、凭据泄露、越权或逻辑缺陷）。
- 受影响的文件、函数或依赖及其版本。
- 最小复现步骤或概念验证。
- 你判断的影响范围与严重程度。
- 是否已经公开披露。

## 我们的处理流程

- **3 天内**：确认收到并给出初步判断。
- **7 天内**：给出修复计划，或说明为何不作为漏洞处理。
- 修复发布后，如果你愿意，我们会在 [CHANGELOG.md](CHANGELOG.md) 与发布说明中致谢。

处理时间可能受课业影响。若超过 7 天没有回复，欢迎在报告中追问。

## 已知设计，不是漏洞

在报告前请先确认你发现的问题不属于以下**已明确的设计选择**：

- **API Key 明文保存在浏览器 `localStorage`，未加密。** 这是第一阶段的明确设计：应用纯前端、无后端、无账号，Key 只存在用户自己的浏览器中，不会上传到本仓库，也不会发送给维护者。因此“同源脚本可读取 localStorage”不构成漏洞。我们仍然欢迎降低该风险的**建议**（例如会话级保存、导出提醒）。
- **题目文本会发送到用户自己配置的 AI 服务。** 这是功能本身，不是数据泄露。
- **题库保存在 IndexedDB，清除站点数据会丢失。** 这是已记录的边界（无云同步、无导出）。
- **应用允许配置本机 HTTP 服务地址。** 远程服务强制 HTTPS、本机服务允许 HTTP，是有意为之。

## 依赖漏洞

第三方依赖的已知漏洞由 Dependabot 自动跟踪，我们会在确认影响后尽快合并安全更新。如果你发现依赖漏洞，请先确认是否已有 Dependabot 告警；若未覆盖，再按上文私密报告。

## English

We use GitHub's [private vulnerability reporting](https://github.com/harbinresearcher/leetcode-companion/security) for this repository. Please do **not** open a public issue for security problems — go to the Security tab and choose **Report a vulnerability**.

Note that storing the API key unencrypted in the browser's `localStorage` is a documented design decision for this local-only, backend-free MVP (the key never reaches the repository or the maintainer), so it is not treated as a vulnerability; suggestions to reduce that risk are welcome.
