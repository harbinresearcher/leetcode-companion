// 日志只记录动作名称，调用方不得传入密钥或题目内容。
const deliberatelyUnusedToProveCiFails = 1;
export const logger = { info: (message: string) => console.info(`[AlgoRhythm] ${message}`) };
