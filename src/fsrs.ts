import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs';
import { logger } from './logger';

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

export function newCard(now = new Date()): Card {
  /*
   * ========================================================================
   * 步骤1：初始化到期卡片
   * ========================================================================
   * 数据源：当前时间；操作：1) 使用库默认卡片 2) 保持日期类型
   */
  logger.info('开始创建复习卡片');
  // 1.1 新卡片立即到期，不手写日程
  const card = createEmptyCard(now);
  logger.info('复习卡片创建完成');
  return card;
}

export function review(card: Card, rating: Grade, now = new Date()): Card {
  /*
   * ========================================================================
   * 步骤1：根据回忆评分安排下一次复习
   * ========================================================================
   * 数据源：已保存卡片与用户评分；操作：1) 默认 FSRS 排期 2) 返回新快照
   */
  logger.info('开始计算复习排期');
  // 1.1 使用明确评分的 next API，保留所有默认参数
  const updated = scheduler.next(card, now, rating).card;
  logger.info('复习排期计算完成');
  return updated;
}
export { Rating };
export type { Grade };
