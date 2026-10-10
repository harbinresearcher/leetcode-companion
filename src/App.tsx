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
    <>
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
            <span className="brand-mark">{'[ar]'}</span>
            <span>
              Algo<strong>Rhythm</strong>
            </span>
          </a>
          <nav className="tabs" aria-label="主导航">
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
            <span className={`status-dot ${configured ? 'connected' : ''}`} />
            <span>AI 设置</span>
          </button>
        </div>
      </header>
      <main className="workspace">
        {message && (
          <p className="success mb-4 text-sm" role="status">
            {message}
          </p>
        )}
        {tab === 'import' && (
          <ImportPage
            configured={configured}
            openSettings={() => setSettings(true)}
            goLibrary={() => setTab('problems')}
          />
        )}
        {tab === 'problems' && <ProblemsPage goImport={() => setTab('import')} />}
        {tab === 'review' && <ReviewPage goImport={() => setTab('import')} />}
      </main>
      <footer className="site-footer">
        <span>
          <span className="status-dot connected" />
          本地题库 · 无需账号
        </span>
        <span className="mono">LEARN THE PATTERN.</span>
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
    </>
  );
}
export default function App() {
  return (
    <StorageBoundary>
      <Workspace />
    </StorageBoundary>
  );
}
