// Application shell: skip link, banner with primary navigation, and the main
// landmark that wraps every route. Provides the semantic structure assistive
// technology relies on.
import { NavLink, Outlet } from 'react-router-dom';

/** Navigation entries for the two personas. */
const NAV_ITEMS = [
  { to: '/assistant', label: 'Fan Assistant' },
  { to: '/operations', label: 'Operations' },
] as const;

/** Top-level layout rendered around every route. */
export function AppLayout(): React.JSX.Element {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="app-header">
        <div className="app-header__inner">
          <NavLink to="/" className="brand">
            Arena<span>Flow</span>
          </NavLink>
          <nav className="primary-nav" aria-label="Primary">
            {NAV_ITEMS.map((navItem) => (
              <NavLink key={navItem.to} to={navItem.to}>
                {navItem.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" className="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer
        className="app-footer"
        style={{
          borderTop: '1px solid var(--color-border)',
          marginTop: 'var(--space-4)',
          padding: 'var(--space-2) 0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-1)',
          }}
        >
          <p className="muted" style={{ margin: 0, fontSize: '0.875rem' }}>
            &copy; {new Date().getFullYear()} ArenaFlow. All rights reserved.
          </p>
          <NavLink
            to="/accessibility"
            style={{ fontSize: '0.875rem', color: 'var(--color-accent)', textDecoration: 'none' }}
          >
            Accessibility Statement
          </NavLink>
        </div>
      </footer>
    </>
  );
}
