// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Client-Side Router (Hash-based)
// ═══════════════════════════════════════════════════════════════
import { getState } from './state.js';
import { renderAuth } from './pages/auth.js';
import { renderOnboard } from './pages/onboard.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderProfile } from './pages/profile.js';
import { renderGenerate } from './pages/generate.js';
import { renderPlans } from './pages/plans.js';
import { renderProgress } from './pages/progress.js';
import { renderChallenges } from './pages/challenges.js';
import { renderSettings } from './pages/settings.js';
import { renderSidebar } from './components/sidebar.js';

const routes = {
  'auth': renderAuth,
  'onboard': renderOnboard,
  'dashboard': renderDashboard,
  'profile': renderProfile,
  'generate': renderGenerate,
  'plans': renderPlans,
  'progress': renderProgress,
  'challenges': renderChallenges,
  'settings': renderSettings,
};

let currentPage = null;

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

export function navigate(page) {
  window.location.hash = `#/${page}`;
}

function handleRoute() {
  const hash = window.location.hash.replace('#/', '') || '';
  const state = getState();

  // Auth guard
  if (!state.user && hash !== 'auth') {
    window.location.hash = '#/auth';
    return;
  }

  // If logged in but no profile, force onboarding
  if (state.user && !state.user.profile && hash !== 'onboard' && hash !== 'auth') {
    window.location.hash = '#/onboard';
    return;
  }

  // Default to dashboard if logged in
  const page = hash || (state.user ? 'dashboard' : 'auth');
  const renderer = routes[page] || routes['dashboard'];

  currentPage = page;
  render(renderer, page);
}

function render(renderer, page) {
  const app = document.getElementById('app');
  const state = getState();
  const needsSidebar = state.user && state.user.profile && page !== 'auth' && page !== 'onboard';

  if (needsSidebar) {
    app.innerHTML = `
      <div class="app-layout">
        ${renderSidebar(page)}
        <div class="main-area">
          <div class="page-enter">${renderer()}</div>
        </div>
      </div>
    `;
  } else {
    app.innerHTML = renderer();
  }
}

// Re-render current page (called when state changes)
export function rerender() {
  handleRoute();
}

export function getCurrentPage() {
  return currentPage;
}
