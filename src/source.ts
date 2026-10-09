import { logger } from './logger';

export async function resolveProblemSource(text: string, link: string): Promise<string> {
  /*
   * ========================================================================
   * 步骤1：读取题目来源
   * ========================================================================
   * 数据源：粘贴文本或公开网页；操作：1) 校验链接 2) 读取正文并限制长度
   */
  logger.info('开始读取题目来源');
  // 1.1 有链接时必须实际读取，不能用一个字符代替题干
  const raw = text.trim();
  const url = link.trim();
  if (!url) {
    if (!raw) throw new Error('请提供原题链接或完整题目描述。');
    logger.info('题目文本读取完成');
    return raw;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('题目链接格式不正确，请填写完整 HTTP(S) 地址。');
  }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password)
    throw new Error('题目链接需为不含账号密码的 HTTP(S) 地址。');
  parsed.hash = '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    // 1.2 Reader 仅接收公开链接，不接收用户的 AI 密钥
    const response = await fetch(`https://r.jina.ai/${parsed.href}`, { signal: controller.signal });
    if (!response.ok)
      throw new Error(
        `题目网页读取失败（${response.status}）。请检查链接、稍后重试，或清空链接后粘贴完整题干。`,
      );
    const content = (await response.text()).trim();
    if (!content || content.length < 40)
      throw new Error('题目网页没有可读正文，请清空链接后粘贴完整题干。');
    if (content.length > 60000)
      throw new Error('网页内容过长，请清空链接后只粘贴题目描述、示例和约束。');
    logger.info('题目网页读取完成');
    return `原题链接：${parsed.href}\n网页正文：\n${content}${raw ? `\n补充描述：\n${raw}` : ''}`;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error('题目网页读取超过 45 秒，请重试或清空链接后粘贴完整题干。', { cause: error });
    if (error instanceof TypeError)
      throw new Error('无法读取题目网页，请检查网络；也可清空链接后粘贴完整题干。', {
        cause: error,
      });
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
