// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Settings Page
// ═══════════════════════════════════════════════════════════════
import { getState } from '../state.js';
import { api } from '../api.js';
import { toast } from '../components/toast.js';

export function renderSettings() {
  const { user } = getState();

  setTimeout(bindSettingsEvents, 0);

  return `
    <div class="page-header">
      <h1>Settings</h1>
      <p>Manage your account, data, and preferences</p>
    </div>

    <div class="settings-grid">
      <!-- Account -->
      <div class="settings-section">
        <div class="settings-section-title">Account</div>
        <div class="setting-row">
          <div><div class="setting-label">${user.name}</div><div class="setting-desc">${user.email}</div></div>
        </div>
        <div class="setting-row">
          <div><div class="setting-label">Edit Profile</div><div class="setting-desc">Update your body stats, goals, and preferences</div></div>
          <button class="btn btn-ghost btn-sm" onclick="window.location.hash='#/onboard'">Edit →</button>
        </div>
      </div>

      <!-- Data -->
      <div class="settings-section">
        <div class="settings-section-title">Data Management</div>
        <div class="setting-row">
          <div><div class="setting-label">Export All Data</div><div class="setting-desc">Download a JSON backup of everything</div></div>
          <button class="btn btn-secondary btn-sm" id="export-btn">📥 Export</button>
        </div>
        <div class="setting-row">
          <div><div class="setting-label">Storage</div><div class="setting-desc">Your data is stored securely on this server</div></div>
          <span class="badge badge-green">SQLite</span>
        </div>
      </div>

      <!-- Display -->
      <div class="settings-section">
        <div class="settings-section-title">Display</div>
        <div class="setting-row">
          <div><div class="setting-label">Theme</div><div class="setting-desc">Premium dark theme</div></div>
          <span class="badge badge-accent">Dark</span>
        </div>
        <div class="setting-row">
          <div><div class="setting-label">Animations</div><div class="setting-desc">Particle background & transitions</div></div>
          <span class="badge badge-green">Enabled</span>
        </div>
      </div>

      <!-- About -->
      <div class="settings-section">
        <div class="settings-section-title">About FitOptim AI</div>
        <div class="setting-row">
          <div><div class="setting-label">Version</div><div class="setting-desc">Built with love for your optimization case study</div></div>
          <span style="font-family:'Inter',sans-serif;font-size:.82rem;color:var(--text-2)">v2.0.0</span>
        </div>
        <div class="setting-row">
          <div><div class="setting-label">Optimizer</div><div class="setting-desc">NSGA-II inspired multi-objective optimization</div></div>
          <span class="badge badge-cyan">Active</span>
        </div>
        <div class="setting-row">
          <div><div class="setting-label">Food Database</div><div class="setting-desc">130+ foods across 7 cuisine regions</div></div>
          <span class="badge badge-green">Loaded</span>
        </div>
        <div class="setting-row">
          <div><div class="setting-label">Exercise Database</div><div class="setting-desc">90+ exercises across 6 categories</div></div>
          <span class="badge badge-green">Loaded</span>
        </div>
      </div>
    </div>
  `;
}

function bindSettingsEvents() {
  document.getElementById('export-btn')?.addEventListener('click', async () => {
    try {
      const data = await api.get('/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitoptim_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Data exported! Check your downloads folder.');
    } catch (e) {
      toast('Export failed', 'error');
    }
  });
}
