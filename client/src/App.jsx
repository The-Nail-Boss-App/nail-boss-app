import { Component, useEffect, useRef, useState } from 'react';
import { COLORS, S, NavItem } from './styles';
import Login from './Login';
import Headquarters from './headquarters/Headquarters';
import DesignStudio from './DesignStudio';
import Proposals from './Proposals';
import NailShop from './NailShop';
import ArtistDistrict from './artist-district/ArtistDistrict';

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
  HEADQUARTERS: 'headquarters',
  STUDIO: 'studio',
  PROPOSALS: 'proposals',
  NAIL_SHOP: 'nail-shop',
  ARTIST_DISTRICT: 'artist-district',
};


const PAGE_TITLES = {
  [PAGES.HEADQUARTERS]: 'Headquarters',
  [PAGES.STUDIO]: 'Design Studio',
  [PAGES.PROPOSALS]: 'Proposals',
  [PAGES.NAIL_SHOP]: 'Nail Shop',
  [PAGES.ARTIST_DISTRICT]: 'Artist District',
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

  useEffect(() => {
    const title = page === PAGES.LOGIN ? 'AnitaSet' : `${PAGE_TITLES[page] || 'Headquarters'} | AnitaSet`;
    document.title = title;
  }, [page]);

  // ── Not logged in ─────────────────────────────────────
  if (page === PAGES.LOGIN) {
    return <Login onLogin={handleLogin} />;
  }

  // ── Sidebar nav items ─────────────────────────────────
  const navItems = [
    {
      id: PAGES.HEADQUARTERS,
      label: 'Headquarters',
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
    {
      id: PAGES.ARTIST_DISTRICT,
      label: 'Artist District',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V8l7-5 7 5v13" />
          <path d="M9 21v-6h6v6" />
          <path d="M9 10h.01" /><path d="M15 10h.01" />
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
        {isDesignStudioSidebarCollapsed ? (
          <img src="/anitaset-favicon.png" alt="AnitaSet" width="42" height="42" style={{ display: "block", width: 42, height: 42, objectFit: "contain" }} />
        ) : (
          <img src="/anitaset-logo-secondary.png" alt="AnitaSet" style={{ display: "block", width: 210, maxWidth: "100%", height: "auto", objectFit: "contain" }} />
        )}
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
        <div aria-label="Signature Nail artist identity" title="Signature Nail™" style={{ display: 'grid', placeItems: isDesignStudioSidebarCollapsed ? 'center' : 'start', marginBottom: 10 }}>
          <div style={{ width: isDesignStudioSidebarCollapsed ? 30 : 54, height: isDesignStudioSidebarCollapsed ? 70 : 116, borderRadius: '50% 50% 46% 46% / 12% 12% 88% 88%', background: 'linear-gradient(90deg, rgba(255,255,255,.7), transparent 18%), linear-gradient(135deg, #f04f96, #5b0f2f)', boxShadow: '0 18px 24px rgba(0,0,0,.30), inset -10px 0 18px rgba(59,31,53,.22)', border: '1px solid rgba(216,166,66,.72)' }} />
        </div>
        <div style={{ fontWeight: 600, color: '#fff', marginBottom: 6, display: isDesignStudioSidebarCollapsed ? 'none' : 'block' }}>Signature Nail™</div>
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
  const topbar = (
    <div style={S.topbar}>
      <span style={{ fontWeight: 600, fontSize: 16, color: COLORS.plum }}>
        {PAGE_TITLES[page]}
      </span>
      <span style={{ fontSize: 13, color: COLORS.muted }}>
        Hey, {techName} 👋
      </span>
    </div>
  );

  // ── Page content ──────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case PAGES.HEADQUARTERS:
        return (
          <ProtectedAppErrorBoundary boundaryKey={PAGES.HEADQUARTERS}>
            <Headquarters
              techName={techName}
              onNavigate={(destination) => { void navigateTo(destination); }}
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
      case PAGES.ARTIST_DISTRICT:
        return (
          <ProtectedAppErrorBoundary boundaryKey={PAGES.ARTIST_DISTRICT}>
            <ArtistDistrict />
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
          {page !== PAGES.HEADQUARTERS && topbar}
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
