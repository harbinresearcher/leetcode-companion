import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { logger } from './logger';
import './index.css';

/*
 * ========================================================================
 * 步骤1：挂载学习工作台
 * ========================================================================
 * 目标：root 节点；操作：1) 创建 React 根节点 2) 启用严格模式
 */
logger.info('开始挂载应用');
// 1.1 核心逻辑位于独立模块，入口只负责 UI
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
logger.info('应用挂载完成');
