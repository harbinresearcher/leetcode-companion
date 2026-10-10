import { Component, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { loadAIConfig } from './ai';
import ImportPage from './pages/ImportPage';
import ProblemsPage from './pages/ProblemsPage';
import ReviewPage from './pages/ReviewPage';
import Settings from './components/Settings';

type Tab = 'import' | 'problems' | 'review';
class StorageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="panel empty" role="alert">
        <h2>暂时无法读取本地题库</h2>
        <p className="muted">
          请检查浏览器是否允许本地存储，然后重新加载。已有数据不会被自动清除。
        </p>
        <button className="primary" onClick={() => location.reload()}>
          重新加载
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Workspace() {
  const [tab, setTab] = useState<Tab>('import');
  const [settings, setSettings] = useState(false);
  const [configured, setConfigured] = useState(() => !!loadAIConfig().apiKey);
  const [message, setMessage] = useState('');
  const total = useLiveQuery(() => db.problems.count(), []);
  const tabs: { key: Tab; label: string }[] = [
    { key: 'import', label: '导入' },
    { key: 'problems', label: '题库' },
    { key: 'review', label: '复习' },
  ];
  return (
    <div className="app-shell" data-view={tab}>
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            href="#"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              setTab('import');
            }}
          >
            <svg
              className="brand-mark"
              viewBox="0 0 32 32"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 23 11 9l6 14M7 18h8M21 23V13m0 5c0-4 3-5 6-5" />
            </svg>
            <span>
              Algo<strong>Rhythm</strong>
            </span>
          </a>
          <nav className="tabs" aria-label="主导航" data-active={tab}>
            <span className="nav-track" aria-hidden="true" />
            {tabs.map((t) => (
              <button
                key={t.key}
                aria-current={tab === t.key ? 'page' : undefined}
                className={tab === t.key ? 'active' : ''}
                onClick={() => {
                  setTab(t.key);
                  setMessage('');
                }}
              >
                {t.label}
                {t.key === 'problems' && <span className="tab-count">{total ?? 0}</span>}
              </button>
            ))}
          </nav>
          <button className="settings-button" onClick={() => setSettings(true)}>
            <span className={`status-dot ${configured ? 'connected' : ''}`} aria-hidden="true" />
            <span>AI 设置</span>
          </button>
        </div>
      </header>
      <main className="workspace" id="main-content" tabIndex={-1}>
        {message && (
          <p className="success mb-4 text-sm" role="status">
            {message}
          </p>
        )}
        <div className="view-stage" key={tab}>
          {tab === 'import' && (
            <ImportPage
              configured={configured}
              openSettings={() => setSettings(true)}
              goLibrary={() => setTab('problems')}
            />
          )}
          {tab === 'problems' && <ProblemsPage goImport={() => setTab('import')} />}
          {tab === 'review' && <ReviewPage goImport={() => setTab('import')} />}
        </div>
      </main>
      <footer className="site-footer">
        <span>
          <span className="status-dot connected" aria-hidden="true" />
          本地题库 · 无需账号
        </span>
        <span>AlgoRhythm</span>
      </footer>
      {settings && (
        <Settings
          onClose={() => setSettings(false)}
          onSaved={() => {
            setConfigured(true);
            setMessage('AI 配置已保存');
          }}
        />
      )}
    </div>
  );
}
export default function App() {
  return (
    <StorageBoundary>
      <Workspace />
    </StorageBoundary>
  );
}
