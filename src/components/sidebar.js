// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Sidebar Component
// ═══════════════════════════════════════════════════════════════
import { getState, logout } from '../state.js';
import { navigate } from '../router.js';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: `<svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>` },
  { id: 'generate', label: 'Generate Plan', icon: `<svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/></svg>` },
  { id: 'plans', label: 'My Plans', icon: `<svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"/></svg>` },
  { id: 'progress', label: 'Progress', icon: `<svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z"/></svg>` },
  { id: 'challenges', label: 'Challenges', icon: `<svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>` },
  { id: 'profile', label: 'Health Profile', icon: `<svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>` },
  { id: 'settings', label: 'Settings', icon: `<svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"/></svg>` },
];

export function renderSidebar(activePage) {
  const user = getState().user;
  if (!user) return '';
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const goal = user.profile?.goal?.replace(/_/g, ' ') || 'Setup pending';

  return `
    <nav class="sidebar" id="main-sidebar">
      <div class="sidebar-logo" onclick="window.location.hash='#/dashboard'">
        <div class="logo-icon">🏋</div>
        <div class="logo-text">Fit<span>Optim</span></div>
      </div>

      <div class="nav-section">
        <div class="nav-label">Menu</div>
        ${NAV_ITEMS.slice(0, 5).map(n => `
          <div class="nav-item ${activePage === n.id ? 'active' : ''}" onclick="window.location.hash='#/${n.id}'">
            ${n.icon}<span>${n.label}</span>
          </div>
        `).join('')}
      </div>

      <div class="nav-section">
        <div class="nav-label">Account</div>
        ${NAV_ITEMS.slice(5).map(n => `
          <div class="nav-item ${activePage === n.id ? 'active' : ''}" onclick="window.location.hash='#/${n.id}'">
            ${n.icon}<span>${n.label}</span>
          </div>
        `).join('')}
      </div>

      <div class="sidebar-bottom">
        <div class="xp-bar-wrap" id="sidebar-xp"></div>
        <div class="user-chip">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-goal">${goal}</div>
          </div>
        </div>
        <button class="logout-btn" id="logout-btn" onclick="document.dispatchEvent(new Event('fitoptim:logout'))">Sign out</button>
      </div>
    </nav>
  `;
}

// Bind logout event globally
document.addEventListener('fitoptim:logout', () => {
  logout();
  window.location.hash = '#/auth';
  import('../router.js').then(r => r.rerender());
});
