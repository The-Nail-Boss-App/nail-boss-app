import { useRef, useState } from 'react';
import { COLORS, S, LogoMark, NavItem } from './styles';
import Login from './Login';
import Dashboard from './Dashboard';
import DesignStudio from './DesignStudio';
import Proposals from './Proposals';
import NailBlueprints from './NailBlueprints';

// ── Pages enum ───────────────────────────────────────────
const PAGES = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  STUDIO: 'studio',
  PROPOSALS: 'proposals',
  NAIL_BLUEPRINTS: 'nail-blueprints',
};

// ── App Shell ────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(PAGES.LOGIN);
  const [techName, setTechName] = useState('');
  const designStudioRef = useRef(null);

  const handleLogin = (name) => {
    setTechName(name);
    setPage(window.location.pathname === '/nail-blueprints' ? PAGES.NAIL_BLUEPRINTS : PAGES.DASHBOARD);
  };

  const guardStudioLeave = async () => {
    if (page !== PAGES.STUDIO || !designStudioRef.current?.hasDirtyWork?.()) return true;
    return designStudioRef.current.prepareToLeave();
  };

  const navigateTo = async (nextPage) => {
    if (nextPage === page) return;
    if (!(await guardStudioLeave())) return;
    if (nextPage === PAGES.NAIL_BLUEPRINTS) window.history.pushState(null, '', '/nail-blueprints');
    else if (window.location.pathname === '/nail-blueprints') window.history.pushState(null, '', '/');
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
      id: PAGES.NAIL_BLUEPRINTS,
      label: 'Nail Blueprints',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16v16H4z" />
          <path d="M8 8h8" /><path d="M8 12h8" /><path d="M8 16h5" />
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
  ];

  // ── Sidebar ───────────────────────────────────────────
  const sidebar = (
    <aside style={S.sidebar}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid rgba(255,255,255,0.12)` }}>
        <LogoMark variant="icon" size={48} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={page === item.id}
            onClick={() => { void navigateTo(item.id); }}
          />
        ))}
      </nav>

      {/* Tech info + logout */}
      <div style={{
        padding: '16px 20px',
        borderTop: `1px solid rgba(255,255,255,0.12)`,
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
      }}>
        <div style={{ fontWeight: 600, color: '#fff', marginBottom: 6 }}>{techName}</div>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            padding: 0,
            fontSize: 12,
            textDecoration: 'underline',
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );

  // ── Top bar ───────────────────────────────────────────
  const pageTitles = {
    [PAGES.DASHBOARD]: 'Dashboard',
    [PAGES.STUDIO]: 'Design Studio',
    [PAGES.PROPOSALS]: 'Proposals',
    [PAGES.NAIL_BLUEPRINTS]: 'Nail Blueprints™',
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
          <Dashboard
            techName={techName}
            onStartLook={() => { void navigateTo(PAGES.STUDIO); }}
            onViewProposals={() => { void navigateTo(PAGES.PROPOSALS); }}
          />
        );
      case PAGES.STUDIO:
        return <DesignStudio ref={designStudioRef} />;
      case PAGES.PROPOSALS:
        return <Proposals />;
      case PAGES.NAIL_BLUEPRINTS:
        return <NailBlueprints />;
      default:
        return null;
    }
  };

  // ── Shell layout ──────────────────────────────────────
  return (
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
  );
}
