import { Component, useRef, useState } from 'react';
import { COLORS, S, LogoMark, NavItem } from './styles';
import Login from './Login';
import Dashboard from './Dashboard';
import DesignStudio from './DesignStudio';
import Proposals from './Proposals';
import NailShop from './NailShop';

class ProtectedAppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.boundaryKey !== this.props.boundaryKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      const message = this.state.error?.message || 'Unknown runtime error';

      return (
        <div role="alert" style={{ padding: 24, color: COLORS.plum }}>
          <h1 style={{ margin: '0 0 12px', fontSize: 22 }}>App shell error</h1>
          <pre style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: COLORS.textMuted,
            fontFamily: 'inherit',
          }}>
            {message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Pages enum ───────────────────────────────────────────
const PAGES = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  STUDIO: 'studio',
  PROPOSALS: 'proposals',
  NAIL_SHOP: 'nail-shop',
};

// ── App Shell ────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(PAGES.LOGIN);
  const [techName, setTechName] = useState('');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const designStudioRef = useRef(null);

  const handleLogin = (name) => {
    setTechName(name);
    setPage(PAGES.STUDIO);
  };

  const guardStudioLeave = async () => {
    if (page !== PAGES.STUDIO || !designStudioRef.current?.hasDirtyWork?.()) return true;
    return designStudioRef.current.prepareToLeave();
  };

  const navigateTo = async (nextPage) => {
    if (nextPage === page) return;
    if (!(await guardStudioLeave())) return;
    setPage(nextPage);
  };

  const handleLogout = async () => {
    if (!(await guardStudioLeave())) return;
    setTechName('');
    setPage(PAGES.LOGIN);
  };

  // ── Not logged in ─────────────────────────────────────
  if (page === PAGES.LOGIN) {
    return <Login onLogin={handleLogin} />;
  }

  // ── Sidebar nav items ─────────────────────────────────
  const navItems = [
    {
      id: PAGES.DASHBOARD,
      label: 'Dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      id: PAGES.STUDIO,
      label: 'Design Studio',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a5 5 0 0 1 0 10 5 5 0 0 1 0-10z" />
          <path d="M12 12c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z" />
        </svg>
      ),
    },
    {
      id: PAGES.PROPOSALS,
      label: 'Proposals',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      id: PAGES.NAIL_SHOP,
      label: 'Nail Shop',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7" />
          <path d="M5 10v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10" />
          <path d="M9 22V12h6v10" />
        </svg>
      ),
    },
  ];

  // ── Sidebar ───────────────────────────────────────────
  const isDesignStudioSidebarCollapsed = page === PAGES.STUDIO && !sidebarExpanded;
  const sidebar = (
    <aside
      data-testid="app-sidebar"
      data-sidebar-mode={page === PAGES.STUDIO ? (isDesignStudioSidebarCollapsed ? "collapsed" : "expanded") : "expanded"}
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}
      onFocus={() => setSidebarExpanded(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSidebarExpanded(false); }}
      style={{
        ...S.sidebar,
        ...(page === PAGES.STUDIO ? (isDesignStudioSidebarCollapsed ? S.sidebarCollapsed : S.sidebarExpanded) : S.sidebarExpanded),
      }}
    >
      {/* Logo */}
      <div style={{
        padding: isDesignStudioSidebarCollapsed ? '10px 0 12px' : '18px 14px 16px',
        borderBottom: `1px solid rgba(255,255,255,0.12)`,
        display: 'grid',
        placeItems: isDesignStudioSidebarCollapsed ? 'center' : 'start',
      }}>
        <LogoMark variant={isDesignStudioSidebarCollapsed ? "icon" : "wordmark"} size={48} style={isDesignStudioSidebarCollapsed ? {} : { width: 176 }} />
      </div>

      {/* Nav */}
      <nav aria-label="Primary navigation" style={{ flex: 1, padding: isDesignStudioSidebarCollapsed ? '14px 0' : '16px 12px' }}>
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={page === item.id}
            onClick={() => { void navigateTo(item.id); }}
            collapsed={isDesignStudioSidebarCollapsed}
          />
        ))}
      </nav>

      {/* Tech info + logout */}
      <div style={{
        padding: isDesignStudioSidebarCollapsed ? '14px 0' : '16px 20px',
        borderTop: `1px solid rgba(255,255,255,0.12)`,
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
      }}>
        <div style={{ fontWeight: 600, color: '#fff', marginBottom: 6, display: isDesignStudioSidebarCollapsed ? 'none' : 'block' }}>{techName}</div>
        <button
          aria-label="Sign out"
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            padding: isDesignStudioSidebarCollapsed ? 8 : 0,
            fontSize: 12,
            textDecoration: 'underline',
          }}
        >
          {isDesignStudioSidebarCollapsed ? '↩' : 'Sign out'}
        </button>
      </div>
    </aside>
  );

  // ── Top bar ───────────────────────────────────────────
  const pageTitles = {
    [PAGES.DASHBOARD]: 'Dashboard',
    [PAGES.STUDIO]: 'Design Studio',
    [PAGES.PROPOSALS]: 'Proposals',
    [PAGES.NAIL_SHOP]: 'Nail Shop',
  };

  const topbar = (
    <div style={S.topbar}>
      <span style={{ fontWeight: 600, fontSize: 16, color: COLORS.plum }}>
        {pageTitles[page]}
      </span>
      <span style={{ fontSize: 13, color: COLORS.muted }}>
        Hey, {techName} 👋
      </span>
    </div>
  );

  // ── Page content ──────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case PAGES.DASHBOARD:
        return (
          <ProtectedAppErrorBoundary boundaryKey={PAGES.DASHBOARD}>
            <Dashboard
              techName={techName}
              onStartLook={() => { void navigateTo(PAGES.STUDIO); }}
              onViewProposals={() => { void navigateTo(PAGES.PROPOSALS); }}
            />
          </ProtectedAppErrorBoundary>
        );
      case PAGES.STUDIO:
        return (
          <ProtectedAppErrorBoundary boundaryKey={PAGES.STUDIO}>
            <DesignStudio ref={designStudioRef} />
          </ProtectedAppErrorBoundary>
        );
      case PAGES.PROPOSALS:
        return (
          <ProtectedAppErrorBoundary boundaryKey={PAGES.PROPOSALS}>
            <Proposals />
          </ProtectedAppErrorBoundary>
        );
      case PAGES.NAIL_SHOP:
        return (
          <ProtectedAppErrorBoundary boundaryKey={PAGES.NAIL_SHOP}>
            <NailShop />
          </ProtectedAppErrorBoundary>
        );
      default:
        return (
          <ProtectedAppErrorBoundary boundaryKey={PAGES.STUDIO}>
            <DesignStudio ref={designStudioRef} />
          </ProtectedAppErrorBoundary>
        );
    }
  };

  // ── Shell layout ──────────────────────────────────────
  return (
    <ProtectedAppErrorBoundary boundaryKey={`shell-${page}`}>
      <div style={S.appShell}>
        {sidebar}
        <div style={S.mainContent}>
          {topbar}
          {/* Design Studio gets full height for its split-panel layout;
              other pages scroll normally. */}
          <div style={{
            flex: 1,
            overflow: page === PAGES.STUDIO ? 'hidden' : 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {renderPage()}
          </div>
        </div>
      </div>
    </ProtectedAppErrorBoundary>
  );
}
