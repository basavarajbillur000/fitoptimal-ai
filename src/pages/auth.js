// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Auth Page (Login / Signup)
// ═══════════════════════════════════════════════════════════════
import { api } from '../api.js';
import { loadUser, setState } from '../state.js';
import { navigate, rerender } from '../router.js';
import { toast } from '../components/toast.js';

let authMode = 'login';

export function renderAuth() {
  const isLogin = authMode === 'login';

  setTimeout(() => {
    // Bind form events after render
    const form = document.getElementById('auth-form');
    if (form) form.addEventListener('submit', isLogin ? handleLogin : handleSignup);
    const toggleLink = document.getElementById('auth-toggle');
    if (toggleLink) toggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      authMode = authMode === 'login' ? 'signup' : 'login';
      rerender();
    });
  }, 0);

  return `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="logo">
          <div class="logo-icon">🏋</div>
          <div class="logo-text">Fit<span>Optim</span></div>
        </div>
        <h1 class="auth-title">${isLogin ? 'Welcome back' : 'Start your journey'}</h1>
        <p class="auth-sub">${isLogin ? 'Sign in to your personalized fitness AI' : 'Create your account — it takes 2 minutes'}</p>

        <form id="auth-form" onsubmit="return false">
          ${!isLogin ? `
            <div class="field">
              <label>Full Name</label>
              <input type="text" id="auth-name" placeholder="Your name" required>
            </div>
          ` : ''}
          <div class="field">
            <label>Email</label>
            <input type="email" id="auth-email" placeholder="you@email.com" required>
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" id="auth-pass" placeholder="${isLogin ? '••••••••' : 'Min 6 characters'}" required minlength="6">
          </div>
          <div id="auth-err" class="err-text"></div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" style="margin-top:.75rem">
            ${isLogin ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        <div class="auth-switch">
          ${isLogin ? "No account? " : "Have an account? "}
          <a id="auth-toggle" href="#">${isLogin ? 'Create one' : 'Sign in'}</a>
        </div>
      </div>
    </div>
  `;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email')?.value.trim();
  const pass = document.getElementById('auth-pass')?.value;
  const errEl = document.getElementById('auth-err');
  if (!email || !pass) { errEl.textContent = 'Please fill all fields.'; return; }

  try {
    const data = await api.post('/auth/login', { email, password: pass });
    loadUser(data.user, data.token);
    toast('Welcome back! 👋');
    if (data.user.profile) navigate('dashboard');
    else navigate('onboard');
  } catch (err) {
    errEl.textContent = err.message;
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('auth-name')?.value.trim();
  const email = document.getElementById('auth-email')?.value.trim();
  const pass = document.getElementById('auth-pass')?.value;
  const errEl = document.getElementById('auth-err');
  if (!name || !email || !pass) { errEl.textContent = 'Please fill all fields.'; return; }
  if (pass.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }

  try {
    const data = await api.post('/auth/signup', { name, email, password: pass });
    loadUser(data.user, data.token);
    toast('Account created! Let\'s set up your profile 🎉');
    navigate('onboard');
  } catch (err) {
    errEl.textContent = err.message;
  }
}
