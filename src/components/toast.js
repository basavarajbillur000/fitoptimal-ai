// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Toast Notification System
// ═══════════════════════════════════════════════════════════════

export function toast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  el.innerHTML = `<span>${icons[type] || '✓'}</span> ${message}`;
  
  container.appendChild(el);

  // Trigger animation
  requestAnimationFrame(() => {
    el.classList.add('show');
  });

  // Auto-remove
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  }, 3500);
}
