# LeetCode Companion 第一阶段执行方案

> 本文档用于交给 AI 编码助手（DSH）执行。目标：**一周内交付一个可本地运行的 Web App MVP**，实现「导入题目 → AI解析模式 → 存入本地库 → FSRS复习」完整闭环。

---

## 一、项目概述

### 项目定位
一个 AI 驱动的算法学习辅助工具，核心思路是**把刷题变成刷模式**。用户导入算法题，AI 自动识别题目所属的算法模式，系统用 FSRS 间隔重复算法安排复习，解决「刷完就忘」的问题。

### 第一阶段目标（MVP）
交付一个**纯前端、本地运行**的 Web App，用户能：
1. 粘贴题目文本 + 链接，AI 自动解析出模式标签、核心洞察、代码骨架
2. 题目存入浏览器本地数据库（IndexedDB）
3. 按 FSRS 算法进行间隔重复复习，评分后自动排下次复习时间
4. 在题库中按模式浏览所有已导入的题目

### 明确不做的事（第一阶段）
- ❌ 浏览器扩展
- ❌ 后端服务器 / 账号系统
- ❌ 自动抓取 LeetCode 链接（CORS 限制，用户手动粘贴）
- ❌ 代码编辑器
- ❌ 模式掌握度可视化 / 面试模式
- ❌ 多平台支持（只支持手动粘贴任意平台文本）

---

## 二、技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 构建 | Vite | 快速启动，热重载 |
| 框架 | React 18 + TypeScript | 标准方案 |
| 样式 | Tailwind CSS | 快速开发 UI |
| 本地存储 | Dexie.js（IndexedDB 封装） | 浏览器本地数据库 |
| 响应式查询 | dexie-react-hooks | useLiveQuery 自动更新 UI |
| 状态管理 | Zustand（可选，MVP可不用） | 轻量 |
| 间隔重复 | ts-fsrs | FSRS 算法 TypeScript 实现 |
| AI | OpenAI 兼容 API | 支持 OpenAI / DeepSeek / 通义千问 |
| ID 生成 | crypto.randomUUID() | 浏览器原生 |

**核心原则**：纯前端，无后端，数据全在浏览器本地。

---

## 三、项目结构

```
leetcode-companion/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── README.md
└── src/
    ├── main.tsx
    ├── index.css
    ├── App.tsx
    ├── types.ts              # 全局类型定义
    ├── patterns.ts           # 16种算法模式定义
    ├── db.ts                 # Dexie 数据库 + CRUD
    ├── ai.ts                 # AI 解析层
    ├── fsrs.ts               # FSRS 封装
    └── pages/
        ├── ImportPage.tsx    # 导入页
        ├── ProblemsPage.tsx  # 题库页
        └── ReviewPage.tsx    # 复习页
```

---

## 四、执行步骤

### Step 1：初始化项目

```bash
npm create vite@latest leetcode-companion -- --template react-ts
cd leetcode-companion
npm install
npm install dexie dexie-react-hooks ts-fsrs
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 2：配置文件

#### `tailwind.config.js`
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

#### `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-slate-950 text-slate-100;
}

* {
  box-sizing: border-box;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #0f172a;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
```

#### `index.html`
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LeetCode Companion</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### `src/main.tsx`
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### Step 3：核心逻辑

#### `src/types.ts`
```typescript
import type { Card } from 'ts-fsrs';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Problem {
  id: string;
  title: string;
  url: string;
  difficulty: Difficulty;
  description: string;
  primaryPatternId: string;
  secondaryPatternIds: string[];
  aiAnalysis: {
    coreInsight: string;
    skeleton: string;
    prerequisites: string[];
  };
  codeDrafts: Record<string, string>;
  notes: string;
  fsrsCard: Card;
  createdAt: number;
  updatedAt: number;
}

export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}
```

#### `src/patterns.ts`
```typescript
export interface Pattern {
  id: string;
  name: string;
  description: string;
  template: string;
}

export const PATTERNS: Pattern[] = [
  {
    id: 'two-pointers',
    name: '双指针',
    description: '两个指针在数组/链表中同向或相向移动',
    template: `let left = 0, right = n - 1;
while (left < right) {
  // 根据条件移动 left 或 right
}`,
  },
  {
    id: 'sliding-window',
    name: '滑动窗口',
    description: '维护一个可变大小的窗口，解决子数组/子串问题',
    template: `let left = 0;
for (let right = 0; right < n; right++) {
  // 扩大窗口
  while (/* 需要收缩 */) {
    // 收缩窗口
    left++;
  }
}`,
  },
  {
    id: 'binary-search',
    name: '二分查找',
    description: '在有序数组中快速定位目标',
    template: `let lo = 0, hi = n - 1;
while (lo <= hi) {
  const mid = (lo + hi) >> 1;
  if (nums[mid] === target) return mid;
  else if (nums[mid] < target) lo = mid + 1;
  else hi = mid - 1;
}`,
  },
  {
    id: 'hash-map',
    name: '哈希表',
    description: '用O(1)查找解决计数、去重、配对问题',
    template: `const map = new Map<string, number>();
for (const x of arr) {
  // 查/存
}`,
  },
  {
    id: 'linked-list',
    name: '链表',
    description: '快慢指针、反转、合并等链表操作',
    template: `let prev = null, cur = head;
while (cur) {
  const next = cur.next;
  cur.next = prev;
  prev = cur;
  cur = next;
}`,
  },
  {
    id: 'stack',
    name: '栈',
    description: '后进先出，用于括号匹配、单调栈等',
    template: `const stack: number[] = [];
for (const x of arr) {
  while (stack.length && /* 条件 */) stack.pop();
  stack.push(x);
}`,
  },
  {
    id: 'queue',
    name: '队列',
    description: '先进先出，用于BFS、任务调度',
    template: `const queue: T[] = [start];
while (queue.length) {
  const node = queue.shift()!;
  // 处理 node
}`,
  },
  {
    id: 'bfs',
    name: '广度优先搜索',
    description: '层序遍历图/树，求最短路径',
    template: `const queue = [start];
const visited = new Set([start]);
while (queue.length) {
  const node = queue.shift()!;
  for (const next of neighbors(node)) {
    if (!visited.has(next)) {
      visited.add(next);
      queue.push(next);
    }
  }
}`,
  },
  {
    id: 'tree-dfs',
    name: '树DFS',
    description: '递归遍历树，解决路径、子树问题',
    template: `function dfs(node) {
  if (!node) return;
  // 处理 node
  dfs(node.left);
  dfs(node.right);
}`,
  },
  {
    id: 'graph-dfs',
    name: '图DFS',
    description: '深度优先遍历图，用于连通性、拓扑排序',
    template: `function dfs(node) {
  if (visited.has(node)) return;
  visited.add(node);
  for (const next of neighbors(node)) dfs(next);
}`,
  },
  {
    id: 'backtracking',
    name: '回溯',
    description: '穷举所有解，用于组合、排列、子集',
    template: `function backtrack(path, choices) {
  if (满足条件) { result.push([...path]); return; }
  for (const c of choices) {
    path.push(c);
    backtrack(path, 剩余choices);
    path.pop();
  }
}`,
  },
  {
    id: 'dynamic-programming',
    name: '动态规划',
    description: '用状态转移方程求解最优化问题',
    template: `const dp = new Array(n + 1).fill(0);
for (let i = 1; i <= n; i++) {
  dp[i] = /* 转移方程 */;
}
return dp[n];`,
  },
  {
    id: 'greedy',
    name: '贪心',
    description: '每步选局部最优，期望得到全局最优',
    template: `// 按某种规则排序
arr.sort((a, b) => /* 规则 */);
let result = 0;
for (const x of arr) {
  // 贪心选择
}`,
  },
  {
    id: 'heap',
    name: '堆/优先队列',
    description: '维护Top K、中位数、合并有序序列',
    template: `const heap = new MinHeap();
for (const x of arr) {
  heap.push(x);
  if (heap.size() > k) heap.pop();
}`,
  },
  {
    id: 'trie',
    name: '字典树',
    description: '前缀匹配、单词搜索',
    template: `class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEnd = false;
}`,
  },
  {
    id: 'union-find',
    name: '并查集',
    description: '动态连通性、集合合并',
    template: `function find(x) {
  if (parent[x] !== x) parent[x] = find(parent[x]);
  return parent[x];
}
function union(a, b) {
  parent[find(a)] = find(b);
}`,
  },
];

export const PATTERN_MAP: Record<string, Pattern> = Object.fromEntries(
  PATTERNS.map(p => [p.id, p])
);

export function getPatternName(id: string): string {
  return PATTERN_MAP[id]?.name ?? id;
}
```

#### `src/fsrs.ts`
```typescript
import {
  fsrs,
  generatorParameters,
  createEmptyCard,
  Rating,
  type Card,
} from 'ts-fsrs';

const f = fsrs(generatorParameters({ enable_fuzz: true }));

export function newCard(): Card {
  return createEmptyCard();
}

export function review(card: Card, rating: Rating): Card {
  const scheduling = f.repeat(card, new Date());
  return scheduling[rating].card;
}

export function getDueDate(card: Card): Date {
  return new Date(card.due);
}

export { Rating };
```

#### `src/db.ts`
```typescript
import Dexie, { type Table } from 'dexie';
import type { Problem } from './types';

export class AlgoDB extends Dexie {
  problems!: Table<Problem, string>;

  constructor() {
    super('leetcode-companion');
    this.version(1).stores({
      problems: 'id, primaryPatternId, createdAt',
    });
  }
}

export const db = new AlgoDB();

export async function saveProblem(p: Problem): Promise<void> {
  await db.problems.put(p);
}

export async function getAllProblems(): Promise<Problem[]> {
  return db.problems.orderBy('createdAt').reverse().toArray();
}

export async function getProblem(id: string): Promise<Problem | undefined> {
  return db.problems.get(id);
}

export async function getDueProblems(): Promise<Problem[]> {
  const now = Date.now();
  const all = await db.problems.toArray();
  return all
    .filter(p => new Date(p.fsrsCard.due).getTime() <= now)
    .sort((a, b) => new Date(a.fsrsCard.due).getTime() - new Date(b.fsrsCard.due).getTime());
}

export async function deleteProblem(id: string): Promise<void> {
  await db.problems.delete(id);
}

export async function updateProblem(id: string, patch: Partial<Problem>): Promise<void> {
  await db.problems.update(id, { ...patch, updatedAt: Date.now() });
}
```

#### `src/ai.ts`
```typescript
import { PATTERNS } from './patterns';
import type { AIConfig, Difficulty } from './types';

export interface AnalysisResult {
  title: string;
  difficulty: Difficulty;
  primaryPatternId: string;
  secondaryPatternIds: string[];
  coreInsight: string;
  skeleton: string;
  prerequisites: string[];
}

function buildPrompt(rawText: string): string {
  const patternList = PATTERNS.map(
    p => `- ${p.id}: ${p.name} - ${p.description}`
  ).join('\n');

  return `你是一个算法模式分析专家。请从下面预定义的模式列表中选择，不要发明新模式。

## 预定义模式
${patternList}

## 用户提供的题目
${rawText}

## 输出要求
严格输出JSON，字段如下：
{
  "title": "题目标题",
  "difficulty": "easy | medium | hard",
  "primaryPatternId": "主要模式id（必须从上面列表选择）",
  "secondaryPatternIds": ["次要模式id"],
  "coreInsight": "一句话核心洞察，说清解题的关键，不要超过50字",
  "skeleton": "该模式的代码骨架（TypeScript，10行以内）",
  "prerequisites": ["前置知识1", "前置知识2"]
}

只输出JSON，不要有其他内容。`;
}

export async function analyzeProblem(
  rawText: string,
  config: AIConfig
): Promise<AnalysisResult> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: buildPrompt(rawText) }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI请求失败: ${res.status} ${text}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  const parsed = JSON.parse(content);

  // 校验 patternId
  const validIds = new Set(PATTERNS.map(p => p.id));
  if (!validIds.has(parsed.primaryPatternId)) {
    parsed.primaryPatternId = 'two-pointers';
  }
  parsed.secondaryPatternIds = (parsed.secondaryPatternIds || []).filter(
    (id: string) => validIds.has(id)
  );

  // 校验 difficulty
  if (!['easy', 'medium', 'hard'].includes(parsed.difficulty)) {
    parsed.difficulty = 'medium';
  }

  return parsed as AnalysisResult;
}

export function loadAIConfig(): AIConfig {
  return {
    apiKey: localStorage.getItem('ai_api_key') || '',
    baseUrl: localStorage.getItem('ai_base_url') || 'https://api.openai.com/v1',
    model: localStorage.getItem('ai_model') || 'gpt-4o-mini',
  };
}

export function saveAIConfig(config: AIConfig): void {
  localStorage.setItem('ai_api_key', config.apiKey);
  localStorage.setItem('ai_base_url', config.baseUrl);
  localStorage.setItem('ai_model', config.model);
}

export function hasAIConfig(): boolean {
  return !!loadAIConfig().apiKey;
}
```

---

### Step 4：页面组件

#### `src/App.tsx`
```tsx
import { useState } from 'react';
import ImportPage from './pages/ImportPage';
import ProblemsPage from './pages/ProblemsPage';
import ReviewPage from './pages/ReviewPage';

type Tab = 'import' | 'problems' | 'review';

export default function App() {
  const [tab, setTab] = useState<Tab>('import');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'import', label: '导入' },
    { key: 'problems', label: '题库' },
    { key: 'review', label: '复习' },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center gap-6">
        <h1 className="text-xl font-bold">LeetCode Companion</h1>
        <nav className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-md text-sm transition ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        {tab === 'import' && <ImportPage />}
        {tab === 'problems' && <ProblemsPage />}
        {tab === 'review' && <ReviewPage />}
      </main>
    </div>
  );
}
```

#### `src/pages/ImportPage.tsx`
```tsx
import { useState } from 'react';
import { analyzeProblem, loadAIConfig, saveAIConfig } from '../ai';
import { saveProblem } from '../db';
import { newCard } from '../fsrs';
import { getPatternName } from '../patterns';
import type { AIConfig, Problem } from '../types';

export default function ImportPage() {
  const [rawText, setRawText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState<Problem | null>(null);
  const [config, setConfig] = useState<AIConfig>(loadAIConfig());
  const [showSettings, setShowSettings] = useState(!config.apiKey);

  function updateConfig(next: AIConfig) {
    setConfig(next);
    saveAIConfig(next);
  }

  async function handleImport() {
    setError('');
    setLoading(true);
    try {
      const result = await analyzeProblem(rawText, config);
      const now = Date.now();
      const problem: Problem = {
        id: crypto.randomUUID(),
        title: result.title,
        url,
        difficulty: result.difficulty,
        description: rawText,
        primaryPatternId: result.primaryPatternId,
        secondaryPatternIds: result.secondaryPatternIds,
        aiAnalysis: {
          coreInsight: result.coreInsight,
          skeleton: result.skeleton,
          prerequisites: result.prerequisites,
        },
        codeDrafts: {},
        notes: '',
        fsrsCard: newCard(),
        createdAt: now,
        updatedAt: now,
      };
      await saveProblem(problem);
      setLastResult(problem);
      setRawText('');
      setUrl('');
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  const canImport = !loading && rawText.trim() && config.apiKey;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">导入题目</h2>
        <button
          onClick={() => setShowSettings(s => !s)}
          className="text-sm text-slate-400 hover:text-white"
        >
          {showSettings ? '收起设置' : 'AI 设置'}
        </button>
      </div>

      {showSettings && (
        <div className="bg-slate-900 rounded-lg p-4 space-y-3 border border-slate-800">
          <div>
            <label className="text-xs text-slate-400">API Key</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={e => updateConfig({ ...config, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full mt-1 bg-slate-800 rounded px-3 py-1.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Base URL</label>
              <input
                value={config.baseUrl}
                onChange={e => updateConfig({ ...config, baseUrl: e.target.value })}
                className="w-full mt-1 bg-slate-800 rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Model</label>
              <input
                value={config.model}
                onChange={e => updateConfig({ ...config, model: e.target.value })}
                className="w-full mt-1 bg-slate-800 rounded px-3 py-1.5 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            支持任何 OpenAI 兼容接口（OpenAI / DeepSeek / 通义千问等）
          </p>
        </div>
      )}

      <div className="space-y-3">
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="题目链接（可选，用于回访）"
          className="w-full bg-slate-900 rounded px-3 py-2 text-sm border border-slate-800"
        />
        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder="把题目描述粘贴到这里（标题、描述、示例、约束都贴上）"
          rows={10}
          className="w-full bg-slate-900 rounded px-3 py-2 text-sm border border-slate-800 font-mono"
        />
        <button
          onClick={handleImport}
          disabled={!canImport}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed px-4 py-2 rounded text-sm font-medium"
        >
          {loading ? 'AI 解析中…' : '导入并解析'}
        </button>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {lastResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-green-400 text-sm">✓ 导入成功</span>
            <span className="font-medium">{lastResult.title}</span>
            <span className="text-xs px-2 py-0.5 bg-blue-900 rounded">
              {getPatternName(lastResult.primaryPatternId)}
            </span>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">核心洞察</div>
            <div className="text-sm">{lastResult.aiAnalysis.coreInsight}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">代码骨架</div>
            <pre className="bg-slate-950 rounded p-3 text-xs overflow-x-auto">
              {lastResult.aiAnalysis.skeleton}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### `src/pages/ProblemsPage.tsx`
```tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db, deleteProblem } from '../db';
import { PATTERNS, getPatternName } from '../patterns';
import { useState } from 'react';

export default function ProblemsPage() {
  const problems = useLiveQuery(
    () => db.problems.orderBy('createdAt').reverse().toArray(),
    []
  );
  const [filter, setFilter] = useState<string>('all');

  if (!problems) return <div className="text-slate-400">加载中…</div>;

  const filtered =
    filter === 'all' ? problems : problems.filter(p => p.primaryPatternId === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">题库（{filtered.length}）</h2>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm"
        >
          <option value="all">全部模式</option>
          {PATTERNS.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="text-slate-400 text-sm py-8 text-center">
          {problems.length === 0 ? '还没有题目，先去导入吧。' : '该模式下暂无题目。'}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{p.title}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-900 rounded">
                    {getPatternName(p.primaryPatternId)}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                    {p.difficulty}
                  </span>
                </div>
                <div className="text-sm text-slate-400 mt-2">{p.aiAnalysis.coreInsight}</div>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                  >
                    原题链接 ↗
                  </a>
                )}
              </div>
              <button
                onClick={() => deleteProblem(p.id)}
                className="text-xs text-slate-500 hover:text-red-400 shrink-0"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### `src/pages/ReviewPage.tsx`
```tsx
import { useEffect, useState } from 'react';
import { db, getDueProblems } from '../db';
import { review, Rating } from '../fsrs';
import { getPatternName } from '../patterns';
import type { Problem } from '../types';

const RATING_LABELS: { rating: Rating; label: string; color: string }[] = [
  { rating: Rating.Again, label: '忘了', color: 'bg-red-700 hover:bg-red-600' },
  { rating: Rating.Hard, label: '困难', color: 'bg-orange-700 hover:bg-orange-600' },
  { rating: Rating.Good, label: '一般', color: 'bg-blue-700 hover:bg-blue-600' },
  { rating: Rating.Easy, label: '简单', color: 'bg-green-700 hover:bg-green-600' },
];

export default function ReviewPage() {
  const [queue, setQueue] = useState<Problem[]>([]);
  const [current, setCurrent] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);

  async function loadQueue() {
    setLoading(true);
    const due = await getDueProblems();
    setQueue(due);
    setCurrent(due[0] ?? null);
    setShowAnswer(false);
    setLoading(false);
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function handleRate(rating: Rating) {
    if (!current) return;
    const updated: Problem = {
      ...current,
      fsrsCard: review(current.fsrsCard, rating),
      updatedAt: Date.now(),
    };
    await db.problems.put(updated);

    const rest = queue.slice(1);
    setQueue(rest);
    setCurrent(rest[0] ?? null);
    setShowAnswer(false);
  }

  if (loading) return <div className="text-slate-400">加载中…</div>;

  if (!current) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">🎉</div>
        <div className="text-slate-300">今日复习完成</div>
        <button
          onClick={loadQueue}
          className="text-sm text-blue-400 hover:underline"
        >
          刷新队列
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>剩余 {queue.length} 题</span>
        <span className="px-2 py-0.5 bg-blue-900 rounded text-white">
          {getPatternName(current.primaryPatternId)}
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">{current.title}</h2>
        <p className="text-sm text-slate-400 whitespace-pre-wrap">
          {current.description.slice(0, 400)}
          {current.description.length > 400 ? '…' : ''}
        </p>
        {current.url && (
          <a
            href={current.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-400 hover:underline"
          >
            打开原题 ↗
          </a>
        )}
      </div>

      {!showAnswer ? (
        <button
          onClick={() => setShowAnswer(true)}
          className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-lg text-sm"
        >
          显示答案与洞察
        </button>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div>
              <div className="text-xs text-slate-400 mb-1">核心洞察</div>
              <div className="text-sm">{current.aiAnalysis.coreInsight}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">代码骨架</div>
              <pre className="bg-slate-950 rounded p-3 text-xs overflow-x-auto">
                {current.aiAnalysis.skeleton}
              </pre>
            </div>
            {current.aiAnalysis.prerequisites.length > 0 && (
              <div>
                <div className="text-xs text-slate-400 mb-1">前置知识</div>
                <div className="flex gap-2 flex-wrap">
                  {current.aiAnalysis.prerequisites.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-slate-800 rounded">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {RATING_LABELS.map(r => (
              <button
                key={r.rating}
                onClick={() => handleRate(r.rating)}
                className={`${r.color} py-3 rounded-lg text-sm font-medium transition`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 五、验收标准

执行完成后，以下流程必须能跑通：

| # | 操作 | 预期结果 |
|---|---|---|
| 1 | `npm run dev` | 浏览器打开 `http://localhost:5173`，看到 LeetCode Companion 界面 |
| 2 | 点击"AI 设置"，填入 API Key | 配置保存到 localStorage，刷新后仍在 |
| 3 | 粘贴一道 LeetCode 题目描述，点"导入并解析" | 3-10秒后显示题目标题、模式标签、核心洞察、代码骨架 |
| 4 | 切到"题库"页 | 看到刚导入的题目，可按模式筛选 |
| 5 | 切到"复习"页 | 看到刚导入的题目（因为新卡片默认到期） |
| 6 | 点击"显示答案与洞察" | 看到核心洞察、代码骨架、前置知识 |
| 7 | 点击任一评分按钮 | 题目从队列移除，FSRS 排下次复习时间 |
| 8 | 刷新页面 | 数据仍在（IndexedDB 持久化） |

---

## 六、注意事项

1. **API Key 安全**：MVP 阶段直接存 localStorage，仅本地使用。README 中要提醒用户不要用共享 key。
2. **CORS 问题**：如果用户填的 Base URL 不支持浏览器直接调用（如某些代理），会报 CORS 错误。MVP 阶段只支持官方 API 或支持 CORS 的代理。
3. **错误处理**：AI 返回的 JSON 可能不合法，`ai.ts` 中已有 try-catch 和字段校验兜底。
4. **模式列表固定**：AI 只能从 `patterns.ts` 中的 16 种模式选择，不能自由生成。
5. **FSRS 参数**：使用默认参数 + `enable_fuzz: true`，不要自己调。
6. **ID 生成**：用 `crypto.randomUUID()`，现代浏览器都支持。
7. **不要做后端**：所有数据在浏览器本地，刷新不丢，清缓存会丢（README 中提醒用户定期导出）。

---

## 七、交付物清单

- [ ] 完整的 Vite + React + TS 项目
- [ ] 所有源码文件（按上述结构）
- [ ] `README.md`，包含：项目介绍、快速开始（3条命令）、截图、AI 配置说明
- [ ] `package.json` 中 scripts：`dev` / `build` / `preview`
- [ ] 项目能 `npm install && npm run dev` 直接跑起来

---

## 八、参考：DeepSeek API 配置示例

推荐用 DeepSeek 做开发测试，成本极低：

| 字段 | 值 |
|---|---|
| Base URL | `https://api.deepseek.com/v1` |
| Model | `deepseek-chat` |
| API Key | 从 platform.deepseek.com 获取 |

---

**执行完毕后，请附上：**
1. 项目运行截图（导入页 + 题库页 + 复习页）
2. `npm run build` 是否通过
3. 遇到的问题和解决方案

需要我补充 README 模板，或者把这份方案导出成 Markdown 文件的结构说明吗？