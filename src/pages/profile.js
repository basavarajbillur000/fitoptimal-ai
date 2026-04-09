// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Health Profile / Passport Page
// ═══════════════════════════════════════════════════════════════
import { getState } from '../state.js';
import { api } from '../api.js';
import { toast } from '../components/toast.js';
import { rerender } from '../router.js';
import { progressRing } from '../components/chart.js';

export function renderProfile() {
  const { user, xp } = getState();
  const p = user?.profile;
  if (!p) return '<div class="empty-state"><div class="empty-title">Complete onboarding first</div></div>';

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const goalLabels = { muscle_gain: 'Muscle Gain', weight_loss: 'Weight Loss', maintenance: 'Maintenance', endurance: 'Endurance', flexibility: 'Flexibility' };
  const bodyTypes = { ectomorph: '🏃 Ectomorph', mesomorph: '💪 Mesomorph', endomorph: '🐻 Endomorph', unsure: '🤔 Unknown' };
  const actLabels = { sedentary: 'Sedentary', light: 'Lightly Active', moderate: 'Moderately Active', active: 'Very Active' };

  // BMI category
  const bmi = p.bmi || 0;
  let bmiCategory = 'Normal', bmiColor = 'var(--green)';
  if (bmi < 18.5) { bmiCategory = 'Underweight'; bmiColor = 'var(--amber)'; }
  else if (bmi >= 25 && bmi < 30) { bmiCategory = 'Overweight'; bmiColor = 'var(--amber)'; }
  else if (bmi >= 30) { bmiCategory = 'Obese'; bmiColor = 'var(--red)'; }

  // Fitness scores
  const fs = p.fitness_scores || {};

  return `
    <div class="page-header">
      <h1>Health Profile</h1>
      <p>Your complete fitness passport — everything about you in one place</p>
    </div>

    <div class="profile-layout">
      <!-- Left: Identity, Stats, Health -->
      <div>
        <!-- Identity Card -->
        <div class="profile-card" style="margin-bottom:1.5rem">
          <div style="position:relative;z-index:1;display:flex;align-items:center;gap:1.25rem;margin-bottom:1.25rem">
            <div class="profile-avatar-lg">${initials}</div>
            <div>
              <div class="profile-name">${user.name}</div>
              <div class="profile-email">${user.email}</div>
              <span class="badge badge-accent" style="margin-top:.35rem">${goalLabels[p.goal] || p.goal}</span>
            </div>
          </div>

          <div class="health-grid">
            <div class="health-item"><div class="health-item-label">Age</div><div class="health-item-val">${p.age} years</div></div>
            <div class="health-item"><div class="health-item-label">Gender</div><div class="health-item-val" style="text-transform:capitalize">${p.gender}</div></div>
            <div class="health-item"><div class="health-item-label">Weight</div><div class="health-item-val">${p.weight} kg</div></div>
            <div class="health-item"><div class="health-item-label">Height</div><div class="health-item-val">${p.height} cm</div></div>
            <div class="health-item"><div class="health-item-label">Body Type</div><div class="health-item-val">${bodyTypes[p.body_type] || '—'}</div></div>
            <div class="health-item"><div class="health-item-label">Activity</div><div class="health-item-val">${actLabels[p.activity] || '—'}</div></div>
          </div>
        </div>

        <!-- Calculated Metrics -->
        <div class="card" style="margin-bottom:1.5rem">
          <div class="section-title" style="margin-bottom:1rem">Body Metrics</div>
          <div class="grid-3" style="text-align:center">
            <div>
              <div style="position:relative;display:inline-block">
                ${progressRing(Math.min(100, (bmi / 35) * 100), '', bmiColor, 90)}
              </div>
              <div style="font-family:'Syne',sans-serif;font-size:.85rem;font-weight:700;margin-top:.35rem">${bmi}</div>
              <div style="font-size:.68rem;color:var(--text-3)">BMI</div>
              <div style="font-size:.65rem;color:${bmiColor};margin-top:.1rem">${bmiCategory}</div>
            </div>
            <div>
              <div style="font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:800;color:var(--accent-light)">${p.bmr || '—'}</div>
              <div style="font-size:.68rem;color:var(--text-3);margin-top:.25rem">BMR (kcal/day)</div>
              <div style="font-size:.65rem;color:var(--text-dim);margin-top:.1rem">Resting metabolism</div>
            </div>
            <div>
              <div style="font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:800;color:var(--green)">${p.tdee || '—'}</div>
              <div style="font-size:.68rem;color:var(--text-3);margin-top:.25rem">TDEE (kcal/day)</div>
              <div style="font-size:.65rem;color:var(--text-dim);margin-top:.1rem">Total daily expenditure</div>
            </div>
          </div>
        </div>

        <!-- Blood Work -->
        <div class="card">
          <div class="section-title" style="margin-bottom:1rem">Blood Work & Health <span style="color:var(--text-3);font-size:.72rem;font-weight:400">(Optional)</span></div>
          ${p.blood_work?.bp || p.blood_work?.sugar ? `
            <div class="health-grid">
              ${p.blood_work.bp ? `<div class="health-item"><div class="health-item-label">Blood Pressure</div><div class="health-item-val">${p.blood_work.bp} mmHg</div></div>` : ''}
              ${p.blood_work.sugar ? `<div class="health-item"><div class="health-item-label">Blood Sugar</div><div class="health-item-val">${p.blood_work.sugar} mg/dL</div></div>` : ''}
            </div>
          ` : '<div style="color:var(--text-3);font-size:.85rem">No blood work data added. You can add this during profile edit.</div>'}

          ${(p.medical_conditions || []).length ? `
            <div style="margin-top:1rem">
              <div style="font-size:.78rem;color:var(--text-3);margin-bottom:.4rem">Medical Conditions</div>
              <div style="display:flex;flex-wrap:wrap;gap:.35rem">
                ${p.medical_conditions.map(c => `<span class="tag">${c}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          ${(p.allergies || []).length ? `
            <div style="margin-top:1rem">
              <div style="font-size:.78rem;color:var(--text-3);margin-bottom:.4rem">Allergies & Intolerances</div>
              <div style="display:flex;flex-wrap:wrap;gap:.35rem">
                ${p.allergies.map(a => `<span class="tag" style="border-color:rgba(255,77,106,.3);color:var(--red)">${a}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Right: Fitness, Diet, Goals -->
      <div>
        <!-- Fitness Assessment -->
        <div class="card" style="margin-bottom:1.5rem">
          <div class="section-title" style="margin-bottom:1rem">Fitness Assessment</div>
          <div class="grid-3" style="text-align:center;gap:1.5rem">
            <div>
              <div style="position:relative;display:inline-block">
                ${progressRing((fs.strength || 5) * 10, '', 'var(--accent)', 85)}
              </div>
              <div style="font-size:.75rem;color:var(--text-2);margin-top:.35rem">Strength</div>
            </div>
            <div>
              <div style="position:relative;display:inline-block">
                ${progressRing((fs.cardio || 5) * 10, '', 'var(--green)', 85)}
              </div>
              <div style="font-size:.75rem;color:var(--text-2);margin-top:.35rem">Cardio</div>
            </div>
            <div>
              <div style="position:relative;display:inline-block">
                ${progressRing((fs.flexibility || 5) * 10, '', 'var(--cyan)', 85)}
              </div>
              <div style="font-size:.75rem;color:var(--text-2);margin-top:.35rem">Flexibility</div>
            </div>
          </div>
        </div>

        <!-- Diet & Preferences -->
        <div class="card" style="margin-bottom:1.5rem">
          <div class="section-title" style="margin-bottom:1rem">Diet & Preferences</div>
          <div class="health-grid">
            <div class="health-item"><div class="health-item-label">Diet</div><div class="health-item-val" style="text-transform:capitalize">${(p.diet || 'non-veg').replace('-', ' ')}</div></div>
            <div class="health-item"><div class="health-item-label">Cuisine</div><div class="health-item-val" style="text-transform:capitalize">${(p.region || 'indian').replace('_', ' ')}</div></div>
            <div class="health-item"><div class="health-item-label">Daily Budget</div><div class="health-item-val">₹${p.budget || 300}</div></div>
            <div class="health-item"><div class="health-item-label">Equipment</div><div class="health-item-val" style="text-transform:capitalize">${(p.equipment || ['none']).join(', ')}</div></div>
          </div>
        </div>

        <!-- Lifestyle -->
        <div class="card" style="margin-bottom:1.5rem">
          <div class="section-title" style="margin-bottom:1rem">Lifestyle</div>
          <div class="health-grid">
            <div class="health-item"><div class="health-item-label">Sleep</div><div class="health-item-val">${p.sleep_hours || '—'} hrs/night</div></div>
            <div class="health-item"><div class="health-item-label">Water</div><div class="health-item-val">${p.water_intake || '—'} L/day</div></div>
            <div class="health-item"><div class="health-item-label">Stress Level</div><div class="health-item-val">${p.stress_level || '—'}/10</div></div>
            <div class="health-item"><div class="health-item-label">Workout Days</div><div class="health-item-val">${p.weekly_workout_days || 4}/week</div></div>
          </div>
        </div>

        <!-- Goals -->
        <div class="card">
          <div class="section-title" style="margin-bottom:1rem">Goals & Timeline</div>
          <div class="health-grid">
            <div class="health-item"><div class="health-item-label">Current Weight</div><div class="health-item-val">${p.weight} kg</div></div>
            <div class="health-item"><div class="health-item-label">Target Weight</div><div class="health-item-val">${p.target_weight || '—'} kg</div></div>
            <div class="health-item"><div class="health-item-label">Timeline</div><div class="health-item-val">${p.target_weeks || 12} weeks</div></div>
            <div class="health-item"><div class="health-item-label">Level</div><div class="health-item-val" style="color:var(--amber)">Lv.${xp.level} (${xp.totalXP} XP)</div></div>
          </div>
          ${p.target_weight ? `
            <div style="margin-top:1rem">
              <div style="font-size:.75rem;color:var(--text-3);margin-bottom:.3rem">Progress to target</div>
              <div class="xp-bar" style="height:8px">
                <div class="xp-fill" style="width:${Math.min(100, Math.max(5, Math.abs(p.weight - (p.target_weight || p.weight)) > 0 ? ((1 - Math.abs(p.weight - p.target_weight) / Math.abs(p.weight - p.target_weight + 0.001)) * 100) : 0))}%;background:linear-gradient(90deg,var(--green),var(--cyan))"></div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}
