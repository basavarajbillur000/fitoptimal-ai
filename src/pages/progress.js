// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Progress Tracking Page
// ═══════════════════════════════════════════════════════════════
import { getState, setState, calcStreak } from '../state.js';
import { api } from '../api.js';
import { toast } from '../components/toast.js';
import { rerender } from '../router.js';
import { drawLineChart, contributionCalendar } from '../components/chart.js';

export function renderProgress() {
  const { user, progressLogs, plans } = getState();
  const p = user?.profile;
  const logs = progressLogs.filter(l => l.weight);
  const streak = calcStreak(progressLogs);

  setTimeout(() => {
    bindProgressEvents();
    // Draw weight chart
    if (logs.length >= 2) {
      const chartData = logs.slice(0, 20).reverse().map(l => l.weight);
      const chartLabels = logs.slice(0, 20).reverse().map(l => new Date(l.logged_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
      setTimeout(() => drawLineChart('weight-chart', chartData, chartLabels, { unit: 'kg', color: '#6C63FF' }), 50);
    }
  }, 0);

  return `
    <div class="page-header">
      <h1>Progress</h1>
      <p>Track your weight, measurements, and consistency</p>
    </div>

    <div class="progress-grid">
      <!-- Log Weight -->
      <div class="prog-card">
        <div class="section-title">Log Weight</div>
        <div class="weight-form">
          <input type="number" id="w-input" placeholder="65.5" step="0.1" style="flex:1;background:var(--bg-3);border:1px solid var(--border);border-radius:var(--r-md);padding:.65rem 1rem;color:var(--text);font-family:'DM Sans',sans-serif;outline:none">
          <button class="btn btn-primary" id="log-weight-btn">Log</button>
        </div>
        <div class="weight-log-list">
          ${logs.length === 0 ? `<div style="color:var(--text-3);font-size:.85rem;text-align:center;padding:1rem">No weight logs yet</div>` :
          logs.slice(0, 7).map((l, i) => {
            const diff = i < logs.length - 1 ? +(l.weight - logs[i + 1].weight).toFixed(1) : null;
            return `
              <div class="weight-log-item">
                <div class="wl-date">${new Date(l.logged_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</div>
                <div style="display:flex;align-items:center;gap:.5rem">
                  <div class="wl-val">${l.weight} kg</div>
                  ${diff !== null ? `<div class="wl-diff ${diff > 0 ? 'up' : 'down'}">${diff > 0 ? '+' : ''}${diff}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Streak -->
      <div class="prog-card" style="text-align:center">
        <div class="section-title">Streak</div>
        <div class="streak-display">
          <div class="streak-fire">🔥</div>
          <div class="streak-num text-gradient-green">${streak}</div>
          <div class="streak-label">${streak === 1 ? 'day' : 'days'} in a row</div>
        </div>
        <div style="display:flex;gap:1.5rem;justify-content:center;margin-top:1rem">
          <div style="text-align:center">
            <div style="font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:700">${plans.length}</div>
            <div style="font-size:.72rem;color:var(--text-3)">Plans saved</div>
          </div>
          <div style="width:1px;background:var(--border)"></div>
          <div style="text-align:center">
            <div style="font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:700">${logs.length}</div>
            <div style="font-size:.72rem;color:var(--text-3)">Weight entries</div>
          </div>
        </div>
      </div>

      <!-- Weight Chart -->
      <div class="prog-card full">
        <div class="section-title">Weight Trend</div>
        ${logs.length >= 2 ? `
          <div class="chart-container" style="height:220px">
            <canvas id="weight-chart"></canvas>
          </div>
        ` : `
          <div style="color:var(--text-3);font-size:.88rem;padding:2rem;text-align:center">
            Log at least 2 weight entries to see your trend chart.
          </div>
        `}
      </div>

      <!-- Body Measurements -->
      <div class="prog-card">
        <div class="section-title">Log Measurements <span style="color:var(--text-3);font-size:.72rem;font-weight:400">(cm)</span></div>
        <div class="grid-2" style="gap:.5rem;margin-top:.75rem">
          <div class="field" style="margin-bottom:.5rem"><label>Chest</label><input type="number" id="m-chest" placeholder="—" step="0.1" style="padding:.5rem .75rem;font-size:.85rem"></div>
          <div class="field" style="margin-bottom:.5rem"><label>Waist</label><input type="number" id="m-waist" placeholder="—" step="0.1" style="padding:.5rem .75rem;font-size:.85rem"></div>
          <div class="field" style="margin-bottom:.5rem"><label>Arms</label><input type="number" id="m-arms" placeholder="—" step="0.1" style="padding:.5rem .75rem;font-size:.85rem"></div>
          <div class="field" style="margin-bottom:.5rem"><label>Thighs</label><input type="number" id="m-thighs" placeholder="—" step="0.1" style="padding:.5rem .75rem;font-size:.85rem"></div>
        </div>
        <button class="btn btn-secondary btn-full btn-sm" id="log-measure-btn" style="margin-top:.5rem">Log Measurements</button>
      </div>

      <!-- AI Insight -->
      <div class="prog-card">
        <div class="section-title">AI Insight</div>
        ${logs.length >= 2 ? `
          <div class="tip-card">
            <div class="tip-label">Weight Trend</div>
            <div class="tip-text">${getInsight(logs, user)}</div>
          </div>
        ` : `
          <div style="color:var(--text-3);font-size:.88rem;padding:1rem 0">
            Log at least 2 weight entries to see your trend analysis here.
          </div>
        `}
      </div>
    </div>
  `;
}

function getInsight(logs, user) {
  const latest = logs[0].weight;
  const oldest = logs[Math.min(logs.length - 1, 6)].weight;
  const diff = +(latest - oldest).toFixed(1);
  const goal = user.profile?.goal;

  if (goal === 'muscle_gain' && diff > 0) return `You've gained ${diff}kg — right on track for muscle gain! Make sure you're hitting your protein target every day.`;
  if (goal === 'weight_loss' && diff < 0) return `Great progress — you've lost ${Math.abs(diff)}kg. Keep your deficit consistent and prioritize protein to preserve muscle.`;
  if (goal === 'maintenance') return `Weight is stable (${diff > 0 ? '+' : ''}${diff}kg). That's exactly the goal for maintenance — keep it consistent.`;
  return `Weight change: ${diff > 0 ? '+' : ''}${diff}kg over ${Math.min(logs.length, 7)} entries. Generate a new plan to stay aligned with your goal.`;
}

function bindProgressEvents() {
  document.getElementById('log-weight-btn')?.addEventListener('click', async () => {
    const val = document.getElementById('w-input')?.value;
    if (!val || isNaN(+val)) { toast('Enter a valid weight', 'error'); return; }

    try {
      await api.post('/progress', { weight: +val });
      const data = await api.get('/progress');
      setState({ progressLogs: data.logs || [] });
      toast(`Weight logged: ${val}kg ✓`);
      rerender();
    } catch (e) {
      toast('Failed to log weight', 'error');
    }
  });

  document.getElementById('log-measure-btn')?.addEventListener('click', async () => {
    const chest = document.getElementById('m-chest')?.value;
    const waist = document.getElementById('m-waist')?.value;
    const arms = document.getElementById('m-arms')?.value;
    const thighs = document.getElementById('m-thighs')?.value;

    if (!chest && !waist && !arms && !thighs) { toast('Enter at least one measurement', 'error'); return; }

    try {
      await api.post('/progress', {
        chest: chest ? +chest : null,
        waist: waist ? +waist : null,
        arms: arms ? +arms : null,
        thighs: thighs ? +thighs : null,
      });
      toast('Measurements logged ✓');
    } catch (e) {
      toast('Failed to log', 'error');
    }
  });
}
