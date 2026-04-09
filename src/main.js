// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Main Entry Point
// ═══════════════════════════════════════════════════════════════
import './styles/index.css';
import { initParticles } from './components/particles.js';
import { initRouter, navigate } from './router.js';
import { loadUser } from './state.js';
import { api } from './api.js';

async function boot() {
  // Start particle background
  initParticles();

  // Try to restore session
  const token = localStorage.getItem('fitoptim_token');
  if (token) {
    try {
      const data = await api.get('/auth/me');
      if (data.user) {
        loadUser(data.user, token);
      }
    } catch {
      localStorage.removeItem('fitoptim_token');
    }
  }

  // Initialize client-side router
  initRouter();
}

boot();
