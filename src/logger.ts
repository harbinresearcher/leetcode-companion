// 日志只记录动作名称，调用方不得传入密钥或题目内容。
export const logger = { info: (message: string) => console.info(`[Companion] ${message}`) };
