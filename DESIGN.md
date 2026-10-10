---
name: AlgoRhythm
description: 浅色算法学习工作台；阅读、回忆和紧凑题库优先。
colors:
  accent: '#315cc7'
  primary: '#202127'
  primary-hover: '#35363e'
  accent-light: '#edf2ff'
  surface: '#fff'
  ground: '#f5f5f7'
  text: '#1d1d1f'
  muted: '#62646b'
  line: '#e5e6eb'
  secondary-text: '#3d414e'
  secondary-line: '#dfe1e9'
  input-surface: '#f6f6f9'
  input-line: '#e9e9ef'
  code-surface: '#f5f6fa'
  code-text: '#334568'
  error-text: '#963441'
  error-surface: '#fff3f3'
  success-text: '#216144'
  success-surface: '#f1f9f4'
typography:
  import-headline:
    fontSize: 'clamp(36px, 5vw, 58px)'
    fontWeight: 650
    lineHeight: 1.13
    letterSpacing: '-0.035em'
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: 'clamp(32px, 4vw, 48px)'
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: '-0.035em'
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
  control: '12px'
  panel: '22px'
  dialog: '24px'
spacing:
  small: '8px'
  control-gap: '12px'
  group: '20px'
  panel-mobile: '20px'
  panel-tablet: '24px'
  panel-desktop: '32px'
  workspace-desktop: '32px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
    rounded: '{rounded.control}'
    padding: '12px 20px'
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.secondary-text}'
    rounded: '{rounded.control}'
    padding: '12px 20px'
  input:
    backgroundColor: '{colors.input-surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.control}'
    padding: '12px 14px'
  panel:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.panel}'
    padding: '32px'
  badge:
    backgroundColor: '{colors.accent-light}'
    rounded: '{rounded.badge}'
    padding: '3px 8px'
---

# Design System: AlgoRhythm

## Overview

**Creative North Star: "明亮学习工作台"**

以明亮、简约的现代产品界面承载算法学习。浅灰背景、白色阅读面和近黑正文形成主层次；大字号任务标题建立首屏主次，黑色主按钮聚焦行动，蓝色承担链接、焦点和选择提示。连续移动的分段导航与错落的学习步骤卡片提供识别，题库仍采用连贯分隔行。

用户在第二轮明确指定 Claude/OpenAI/Gemini/Apple 官网级简约现代参考，固定方向优先。本轮有真实七方向探索与 concept-roll，seed d47c805f、assigned index 4；未机械采用随机方向。已打开 Apple Mac 官方页作为 QUALITY BAR；Claude 首屏未完整加载，OpenAI 浏览器挑战与 Gemini 登录跳转未提供可靠视觉稿，不声称完整参考过四站。第一轮未运行 seed 是历史事实，不代表本轮缺失。参考仅用于尺度、层次和交互判断，原生 CSS 自写，不复制第三方源码或增加依赖。

**Key Characteristics:**

- 大字号任务标题与清晰首屏主次。
- 浅灰背景、白色圆角阅读面和黑色主操作。
- 连续分段导航与有空间关联的答案揭示。
- 桌面留白与手机单列分别安排。

## Colors

近黑正文与主按钮形成清楚主次，操作蓝只承担交互。frontmatter 是提取 token 的规范层，源码是实现事实来源。

### Primary

- **近黑主操作 / primary**：导入、揭示与保存按钮；primary-hover 表达悬停。
- **交互蓝 / accent**：链接、可见焦点、输入光标与相关选择提示。
- **浅选择蓝 / accent-light**：模式徽标、恢复选项与学习步骤末项。

### Neutral

- **浅灰背景 / ground**：页面与浏览器 theme-color。
- **阅读白 / surface**：面板、题库、模态和选中导航轨道。
- **近黑正文 / text**：正文、标题与选中导航文字。
- **说明灰 / muted**：次级信息与未选中导航。
- **边界灰 / line**：题目分隔与细边界。
- input-surface 和 input-line 为浅灰输入；secondary-text 与 secondary-line 区分次级操作。
- code-surface 与 code-text 保持浅色等宽阅读区。

语义红、绿用于错误、成功、难度与评分；同时保留文字，不能只凭颜色辨别状态。

**The Action Rule.** 主按钮使用近黑色，蓝色保留给链接、焦点和选择提示。

## Typography

**Body Font:** 系统无衬线字体，回退 Segoe UI、Microsoft YaHei 与 sans-serif。
**Label/Mono Font:** Cascadia Code、Consolas 与 monospace。

普通页面标题使用 clamp(32px, 4vw, 48px)，字重 650，行高 1.15。导入两行标题使用独立 import-headline，桌面上限 58px，700px 以下明确为 40px。其他页面手机标题仍按 clamp 计算，并非统一 40px。页描述 15px；导入说明桌面 16px、手机 14px。题干 14px、行高 1.9、最大宽度 75ch；代码 13px、行高 1.85。题库标题 17px，复习题目使用 text-2xl。标签通常 12–14px；数字使用等宽数字。没有外部字体加载。

## Layout

头部与主内容最大宽度 1200px，左右留白 32px。桌面头部最小高度 88px，以 1fr auto 1fr 网格居中放置宽 316px 的分段导航；设置在右。主内容内边距 48px 32px 72px。桌面头部 sticky 并半透明，手机恢复普通定位。复习列最大宽度 850px。

导入标题桌面居中，输入与学习步骤为 1.75fr / minmax(280px, 1fr) 两列，间距 56px。辅助步骤为轻微错落的三张卡片，代表真实学习顺序；不新增业务。题库保持备份、筛选、分隔题目行。评分桌面四列。

900px 以下留白 24px、导入间距 24px；700px 以下导航在第二行且占满宽度，导入单列，标题左对齐，备份与回忆操作竖排，评分两列，主内容留白 20px。360px 以下留白 16px，最低支持宽度 320px。模态宽 min(540px, calc(100% - 32px))，最大高度 calc(100dvh - 32px)，内部滚动。

## Elevation & Depth

白色面板和列表使用轻环境阴影，不再是第一轮纯平面边框。面板阴影为 0 8px 32px #272b4506 与 0 1px 2px #272b4508。步骤卡片使用 0 12px 28px #3137520c 与 0 2px 4px #31375205；选中导航轨道有低阴影。模态使用 0 32px 100px #171d3933，遮罩 #2c304052 并模糊 5px。桌面头部模糊 18px。深度辅助层次，不干扰题干。

## Shapes

面板与列表整体圆角 22px，模态 24px，主次按钮和输入 12px，代码 14px，评分 16px，备份栏和学习步骤 18px。分段导航外框 28px、轨道 24px；设置按钮为胶囊，关闭按钮为圆形。既有小型模式徽标 4px，不强行把所有元素改成同一圆角。

## Components

- **Buttons**：主次按钮最小高度 46px，12px 20px 内边距、14px 字号、550 字重。禁用透明度 0.55。按压缩放 0.975，持续 80ms；一般背景、边界、阴影变化 180ms。真实 aria-busy 显示 14px 旋转符号，800ms 一圈并保留忙碌文字。
- **Inputs**：显式文字标签，浅灰填充。聚焦变白、边框 #b4c4ee，4px 浅蓝焦点晕；全局 focus-visible 保留 2px 蓝色轮廓与 3px 偏移。textarea 最小高度 216px，可竖向调整。
- **Navigation**：三等分轨道导航，以 data-active 驱动同一白色轨道连续平移 260ms。活动按钮近黑字、600 字重并有 aria-current；不是第一轮蓝色底线。配置状态点不证明服务连通。
- **Reading panels**：白色阅读面、柔和深度与宽松内边距。题库整容器分隔行；精确指针悬停轻微变底色。题干最大 75ch，代码内部滚动。
- **Learning steps**：真实题干、模式、回忆三层错落卡片；精确指针悬停收齐倾斜。没有持续背景动画、鼠标追随或额外统计。
- **Reveal and detail**：页面进入 300ms、上移 8px；当前复习题目进入 280ms。答案在题干下方以 340ms、16px 位移和裁切揭示。原生 details 在支持 interpolate-size 的浏览器以 260ms 展开；不支持时立即展示。
- **Dialogs**：原生 showModal 即时约束焦点，视觉进入 240ms、12px 位移与 scale 0.985；遮罩 200ms。关闭即时恢复入口焦点。备份默认跳过冲突、取消先获焦点；忙碌时禁止关闭；覆盖有不可撤销警告。设置失败保留表单。
- **Review and feedback**：揭示后才提供四档回忆评分，忙碌禁用，持久化成功才切题。成功用 role=status，失败用 role=alert。删除保留原生不可撤销确认。减少动态效果偏好下关闭动画和过渡，包括伪元素、遮罩、details 与 busy spinner；文字状态仍存在。

**The Recall Rule.** 分析和评分不得先于用户揭示答案。

提取依据：src/index.css、src/App.tsx、三个 pages、Settings 与 index.html。方向和动效合约位于第二轮 work 记录；合约初始时长是设计意图，本文件采用当前源码时长。12 张 desktop/mobile 截图由主任务更新并打开。主任务报告 9 motion、41 backup、24 site、8 keyboard、29 core checks 通过；本次文档子任务没有重跑这些检查。AI 为模拟请求，不代表真实分类质量或完整无障碍认证。第二轮 reviewer 的材料修正项为文档过时；不把第一轮缺失 seed 写成当前状态。

## Do's and Don'ts

### Do:

- 保留语义标签、可见焦点和原生模态焦点约束。
- 保留独立回忆、揭示、评分的顺序与真实忙碌反馈。
- 让题干与代码可读，代码溢出仅在代码块内滚动。
- 遵守 reduced-motion，动画不得延迟操作和真实完成。

### Don't:

- 不要新增营销页面、账号、仪表盘或其他业务功能。
- 不要把参考站点当作批准设计稿，或复制第三方源码。
- 不要用动画伪造进度，也不宣称模拟 AI 等于真实质量验收。
