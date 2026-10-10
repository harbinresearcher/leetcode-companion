import { useEffect, useRef, useState, type FormEvent } from 'react';
import { loadAIConfig, saveAIConfig } from '../ai';
import { logger } from '../logger';

export default function Settings({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [config, setConfig] = useState(loadAIConfig);
  const [error, setError] = useState('');
  useEffect(() => {
    /*
     * ========================================================================
     * 步骤1：打开可键盘操作的设置窗口
     * ========================================================================
     * 目标：原生 dialog；操作：1) 模态显示 2) 卸载时关闭并恢复入口焦点
     */
    logger.info('开始打开 AI 设置');
    // 1.1 原生模态负责焦点约束和 Escape 行为
    const element = dialog.current;
    const returnFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    logger.info('AI 设置打开完成');
    return () => {
      // 1.2 保存元素快照，卸载后 ref 可能已经清空
      element?.close();
      returnFocus?.focus();
    };
  }, []);

  function save(event: FormEvent) {
    event.preventDefault();
    /*
     * ========================================================================
     * 步骤1：确认用户配置
     * ========================================================================
     * 数据源：设置表单；操作：1) 校验并写入 2) 成功后关闭
     */
    logger.info('开始提交 AI 设置');
    // 1.1 写入失败保留表单与密钥输入，不显示成功
    try {
      saveAIConfig(config);
      onSaved();
      onClose();
      logger.info('AI 设置提交完成');
    } catch (e) {
      setError(e instanceof Error ? e.message : '配置保存失败。');
    }
  }
  return (
    <dialog
      className="settings-dialog"
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="settings-title"
    >
      <form onSubmit={save} className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="settings-title">AI 设置</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭设置">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <label className="field">
          API Key
          <input
            type="password"
            name="api-key"
            autoComplete="off"
            required
            value={config.apiKey}
            placeholder="输入你的 API Key"
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
          />
        </label>
        <label className="field">
          Base URL
          <input
            type="url"
            name="base-url"
            spellCheck={false}
            autoComplete="off"
            required
            value={config.baseUrl}
            placeholder="https://api.deepseek.com/v1"
            onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
          />
        </label>
        <label className="field">
          Model
          <input
            name="model"
            spellCheck={false}
            autoComplete="off"
            required
            value={config.model}
            placeholder="deepseek-chat"
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
          />
        </label>
        <p className="muted text-sm leading-relaxed">
          默认使用 DeepSeek。兼容 OpenAI 风格的 API，服务需支持浏览器跨域请求和 JSON
          输出。密钥仅保存在此浏览器中，请使用自己的密钥。
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary w-full" type="submit">
          保存配置
        </button>
      </form>
    </dialog>
  );
}
