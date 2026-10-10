---
name: AlgoRhythm
description: 浅色算法学习工作台；阅读、回忆和紧凑题库优先。
colors:
  accent: '#2459bb'
  accent-hover: '#194797'
  accent-light: '#eef4ff'
  surface: '#fff'
  ground: '#f5f7fa'
  text: '#202a3b'
  muted: '#59677a'
  line: '#dce2eb'
  secondary-text: '#35445c'
  secondary-line: '#bdc9d9'
  input-line: '#b7c4d5'
  code-surface: '#f4f6f9'
  code-text: '#304a70'
  error-text: '#963441'
  error-surface: '#fff3f3'
  success-text: '#216144'
  success-surface: '#f1f9f4'
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: 'clamp(25px, 2.6vw, 30px)'
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: '-0.025em'
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: '17px'
    fontWeight: 600
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: '13px'
    fontWeight: 600
  code:
    fontFamily: "'Cascadia Code', Consolas, monospace"
    fontSize: '13px'
    lineHeight: 1.85
rounded:
  badge: '4px'
  control: '6px'
  panel: '8px'
  dialog: '10px'
spacing:
  small: '8px'
  control-gap: '12px'
  group: '20px'
  panel-mobile: '20px'
  panel-tablet: '24px'
  panel-desktop: '28px'
  workspace-desktop: '32px'
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.surface}'
    rounded: '{rounded.control}'
    padding: '10px 16px'
  button-primary-hover:
    backgroundColor: '{colors.accent-hover}'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.secondary-text}'
    rounded: '{rounded.control}'
    padding: '10px 16px'
  input:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.control}'
    padding: '12px 14px'
  panel:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.panel}'
    padding: '28px'
  badge:
    backgroundColor: '{colors.accent-light}'
    rounded: '{rounded.badge}'
    padding: '3px 8px'
---

# Design System: AlgoRhythm

## Overview

**Creative North Star: "学习工作台"**

学习工作台围绕题干、洞察和回忆展开。白色阅读面置于冷灰背景，深色字保持主导，蓝色标明操作和选中状态。紧凑导航与分隔题目行维持连续阅读，不用宣传区抢占首屏。

本文件以当前源码作 scan-mode 提取。方向由主代理依据用户整站重设计委托与 PRODUCT.md 的学习任务自主选择，并非用户逐项批准颜色或设计稿；“学习工作台”是描述性名称，未经过独立命名审批。本轮没有运行 concept seed 或 seeded concept exploration，没有 Figma 或批准设计稿。收尾 reviewer 的最终 disposition 为 fix：界面材料问题已 resolved，concept seed/concept-roll 与预先设定 QUALITY BAR 仍 unresolved。此处记录流程缺口，不追认未发生的探索或批准，不声称完整 skill 验收通过。

**Key Characteristics:**

- 白色阅读面、冷灰底与深色正文。
- 蓝色主操作和选中标记。
- 题库使用同一容器内的分隔行。
- 先独立回忆，再揭示分析并评分。

## Colors

主色为清晰的操作蓝，中性色承担阅读层次。数值以上方 frontmatter 为准；源码仍是实现事实来源。

### Primary

- **操作蓝 / accent**：导入、揭示、保存、链接、焦点和选中导航。
- **深操作蓝 / accent-hover**：主按钮悬停。
- **浅选中蓝 / accent-light**：模式徽标和恢复选项选中背景。

### Neutral

- **阅读白 / surface**：内容、控件与模态。
- **冷灰底 / ground**：页面背景与浏览器 theme-color。
- **墨色 / text**：正文与主要标题。
- **说明灰 / muted**：提示、元数据与非选中导航。
- **分隔灰 / line**：面板轮廓和题目分隔线。
- secondary-text、secondary-line、input-line 区分次级操作与输入边界。
- code-surface、code-text 为浅色代码阅读区。

错误与成功使用语义红、绿。难度和评分同时有文本，不能只靠颜色区分。

**The Action Rule.** 蓝色强调操作与选中状态，题干正文保持深色。

## Typography

**Body Font:** 系统无衬线字体，依次回退到 Segoe UI、Microsoft YaHei 与 sans-serif。
**Label/Mono Font:** Cascadia Code、Consolas 与 monospace。

页面标题使用 headline；题库标题使用 title；正文与题干使用 body。题干行高宽松，最大阅读宽度为 75ch。说明文字为 12–14px，操作标签为 13px；代码使用独立等宽字体。复习题目标题采用 24px Tailwind text-2xl；没有独立 display 字体或外部字体资源。数字计数使用等宽数字，不把 650 字重假定为每个平台都有相同字形。

## Layout

全局容器最大宽度 1160px，桌面左右内边距 32px；顶部导航最小高度 72px。主内容桌面内边距为 38px 32px 56px。复习列最大宽度 850px。

导入使用 1.9fr 主输入列与 minmax(250px, 1fr) 辅助列，列间距 36px。题库以备份栏、筛选栏和题目列表依次排列，不逐题叠加悬浮卡片。桌面评分四列。

900px 以下容器左右留白变为 24px；700px 以下主导航换到第二行，导入单列，备份栏和回忆操作竖排，评分两列，主内容左右留白 20px。360px 以下左右留白 16px。body 最小宽度为 320px。模态宽度 min(520px, calc(100% - 32px))，最大高度 calc(100dvh - 32px)，内容内部滚动。

## Elevation & Depth

页面靠白色面、冷灰底和细边界区分层次；常规面板与题库不加阴影。模态使用 0 24px 80px #162c4d30 阴影和 #16283e66 遮罩；导入浮层使用 0 10px 30px #182d4b18 阴影。阴影只帮助暂时覆盖层脱离阅读面。

## Shapes

徽标圆角 4px，常规控件与代码块 6px，面板和列表外框 8px，模态 10px。状态点为圆形。题目行之间使用细分隔线；圆角属于列表整体，不重复包裹每一行。

## Components

- **Buttons**：主、次按钮最小高度 44px；忙碌或无效时禁用，透明度 0.55。文字按钮也保留 44px 操作高度。默认仅背景与边框做 140ms 过渡；减少动态效果偏好下取消过渡。
- **Inputs**：可见文字标签；白底、细边界，textarea 最小高度 260px，允许竖向调整。全局 focus-visible 为 2px 蓝色轮廓，偏移 3px。
- **Navigation**：导入、题库、复习；活动项蓝色字与底部 2px 线，并用 aria-current 表达。题库计数为小型中性徽标；设置入口有文字和状态点，点仅表示配置状态，不证明服务连通。
- **Problem rows**：标题、难度、模式、洞察、元数据，再到原生 details 的题干与分析。删除入口带明确标签，并保留不可撤销确认。
- **Review**：先题干与揭示按钮；揭示后显示分析和四档评分。保存期间禁用评分；保存成功才推进题目。评分提示描述实际回忆，不能换成固定排期承诺。
- **Dialogs**：设置和备份用原生 showModal，关闭后恢复入口焦点。备份默认跳过冲突；覆盖选项配明确警告。写入期间不能关闭备份预览；取消按钮获得初始焦点。设置失败保留表单和可见错误。
- **Feedback**：导入成功/失败浮层可关闭；成功与状态用 role=status，错误用 role=alert。空题库、无到期题和存储失败各保留可用后续操作。

**The Recall Rule.** 分析和评分不得先于用户揭示答案。

证据：src/index.css、src/App.tsx、src/pages/ImportPage.tsx、src/pages/ProblemsPage.tsx、src/pages/ReviewPage.tsx、src/components/Settings.tsx、index.html。截图证据为本轮 outputs 中 import、library、backup、review、review-revealed、settings 的 desktop/mobile 共 12 张；浏览器样例为合成题库，不代表真实模型质量或完整无障碍认证。

## Do's and Don'ts

### Do:

- 保留语义标签、可见焦点和可操作的原生模态。
- 题干控制阅读宽度，代码只在代码块内部横向滚动。
- 保留写入前确认、忙碌禁用和失败提示。

### Don't:

- 不要新增仪表盘、掌握度、账号或其他业务功能。
- 不要用装饰替代题干、分析与实际操作。
- 不要把未运行的真实 AI 验收或概念探索写成已完成。
