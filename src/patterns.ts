export interface Pattern { id: string; name: string; description: string; template: string }

export const PATTERNS: Pattern[] = [
  { id: 'two-pointers', name: '双指针', description: '两个指针在数组或链表中同向或相向移动', template: 'let left = 0, right = n - 1;\nwhile (left < right) {\n  // 根据条件移动 left 或 right\n}' },
  { id: 'sliding-window', name: '滑动窗口', description: '维护可变窗口，解决子数组或子串问题', template: 'let left = 0;\nfor (let right = 0; right < n; right++) {\n  // 扩大窗口；必要时收缩 left\n}' },
  { id: 'binary-search', name: '二分查找', description: '在有序空间中快速定位目标', template: 'let lo = 0, hi = n - 1;\nwhile (lo <= hi) {\n  const mid = lo + Math.floor((hi - lo) / 2);\n  // 比较目标并缩小范围\n}' },
  { id: 'hash-map', name: '哈希表', description: '快速查找，解决计数、去重和配对问题', template: 'const map = new Map();\nfor (const x of arr) {\n  // 查询与存储\n}' },
  { id: 'linked-list', name: '链表', description: '快慢指针、反转和合并', template: 'let prev = null, cur = head;\nwhile (cur) {\n  const next = cur.next;\n  cur.next = prev;\n  prev = cur;\n  cur = next;\n}' },
  { id: 'stack', name: '栈', description: '后进先出，括号匹配与单调栈', template: 'const stack = [];\nfor (const x of arr) {\n  // 按条件出栈\n  stack.push(x);\n}' },
  { id: 'queue', name: '队列', description: '先进先出，BFS 与任务调度', template: 'const queue = [start];\nfor (let i = 0; i < queue.length; i++) {\n  const node = queue[i];\n  // 处理 node\n}' },
  { id: 'bfs', name: '广度优先搜索', description: '层序遍历图或树，求无权最短路径', template: 'const queue = [start], visited = new Set([start]);\nfor (let i = 0; i < queue.length; i++) {\n  for (const next of neighbors(queue[i])) {\n    if (!visited.has(next)) { visited.add(next); queue.push(next); }\n  }\n}' },
  { id: 'tree-dfs', name: '树 DFS', description: '递归遍历树，解决路径与子树问题', template: 'function dfs(node) {\n  if (!node) return;\n  // 处理 node\n  dfs(node.left);\n  dfs(node.right);\n}' },
  { id: 'graph-dfs', name: '图 DFS', description: '深度遍历图，连通性与拓扑排序', template: 'function dfs(node) {\n  if (visited.has(node)) return;\n  visited.add(node);\n  for (const next of neighbors(node)) dfs(next);\n}' },
  { id: 'backtracking', name: '回溯', description: '穷举组合、排列与子集', template: 'function backtrack(path, choices) {\n  // 满足条件时保存路径\n  for (const c of choices) {\n    path.push(c);\n    // 递归处理剩余选择\n    path.pop();\n  }\n}' },
  { id: 'dynamic-programming', name: '动态规划', description: '状态转移，解决重叠子问题', template: 'const dp = new Array(n + 1).fill(0);\nfor (let i = 1; i <= n; i++) {\n  // dp[i] = 状态转移\n}\nreturn dp[n];' },
  { id: 'greedy', name: '贪心', description: '局部最优选择，需要证明全局正确性', template: '// 按规则排序\nlet result = 0;\nfor (const x of arr) {\n  // 做出贪心选择\n}' },
  { id: 'heap', name: '堆 / 优先队列', description: 'Top K、中位数与有序序列合并', template: 'const heap = new MinHeap();\nfor (const x of arr) {\n  heap.push(x);\n  if (heap.size() > k) heap.pop();\n}' },
  { id: 'trie', name: '字典树', description: '前缀匹配与单词搜索', template: 'class TrieNode {\n  children = new Map();\n  isEnd = false;\n}' },
  { id: 'union-find', name: '并查集', description: '动态连通性与集合合并', template: 'function find(x) {\n  if (parent[x] !== x) parent[x] = find(parent[x]);\n  return parent[x];\n}\nfunction union(a, b) { parent[find(a)] = find(b); }' },
];

export const PATTERN_MAP: Record<string, Pattern> = Object.fromEntries(PATTERNS.map(p => [p.id, p]));
export const getPatternName = (id: string): string => PATTERN_MAP[id]?.name ?? '分类待确认';
