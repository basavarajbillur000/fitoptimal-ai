// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Enhanced Onboarding (8 Steps)
// ═══════════════════════════════════════════════════════════════
import { getState, setState, loadUser } from '../state.js';
import { api } from '../api.js';
import { navigate, rerender } from '../router.js';
import { toast } from '../components/toast.js';

let step = 1;
let data = {};
const TOTAL_STEPS = 8;

const STEPS = ['Body Stats','Body Type','Fitness Goal','Activity Level','Food Preferences','Health Info','Lifestyle','Goals & Timeline'];

export function renderOnboard() {
  setTimeout(bindOnboardEvents, 0);

  return `
    <div class="onboard-wrap">
      <div class="onboard-card">
        <div class="step-bar">
          ${STEPS.map((_, i) => `<div class="step-dot ${i < step - 1 ? 'done' : i === step - 1 ? 'active' : ''}"></div>`).join('')}
        </div>
        <div class="step-indicator">Step ${step} of ${TOTAL_STEPS}</div>
        ${renderStep()}
      </div>
    </div>
  `;
}

function renderStep() {
  switch(step) {
    case 1: return stepBodyStats();
    case 2: return stepBodyType();
    case 3: return stepGoal();
    case 4: return stepActivity();
    case 5: return stepFood();
    case 6: return stepHealth();
    case 7: return stepLifestyle();
    case 8: return stepTimeline();
    default: return '';
  }
}

function stepBodyStats() {
  return `
    <h2 class="onboard-title">Let's build your profile</h2>
    <p class="onboard-sub">We need these to calculate your TDEE and optimize your plans</p>
    <div class="grid-2">
      <div class="field"><label>Age</label><input type="number" id="ob-age" value="${data.age || ''}" placeholder="22" min="13" max="99"></div>
      <div class="field"><label>Gender</label>
        <select id="ob-gender">
          <option value="male" ${data.gender === 'male' ? 'selected' : ''}>Male</option>
          <option value="female" ${data.gender === 'female' ? 'selected' : ''}>Female</option>
          <option value="other" ${data.gender === 'other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
      <div class="field"><label>Weight (kg)</label><input type="number" id="ob-weight" value="${data.weight || ''}" placeholder="65" step="0.1"></div>
      <div class="field"><label>Height (cm)</label><input type="number" id="ob-height" value="${data.height || ''}" placeholder="170"></div>
    </div>
    <div id="ob-err" class="err-text"></div>
    ${navButtons(false)}
  `;
}

function stepBodyType() {
  const types = [
    { id: 'ectomorph', icon: '🏃', label: 'Ectomorph', desc: 'Lean, long, hard to gain' },
    { id: 'mesomorph', icon: '💪', label: 'Mesomorph', desc: 'Athletic, muscular build' },
    { id: 'endomorph', icon: '🐻', label: 'Endomorph', desc: 'Wider, stores fat easily' },
    { id: 'unsure', icon: '🤔', label: 'Not Sure', desc: 'Let the AI decide' },
  ];
  return `
    <h2 class="onboard-title">What's your body type?</h2>
    <p class="onboard-sub">This helps us tailor exercise intensity and calorie recommendations</p>
    <div class="select-grid select-grid-4">
      ${types.map(t => `
        <div class="select-card ${data.bodyType === t.id ? 'selected' : ''}" data-body-type="${t.id}">
          <div class="sc-icon">${t.icon}</div>
          <div class="sc-label">${t.label}</div>
        </div>
      `).join('')}
    </div>
    <div id="ob-err" class="err-text"></div>
    ${navButtons()}
  `;
}

function stepGoal() {
  const goals = [
    { id: 'muscle_gain', icon: '💪', label: 'Muscle Gain' },
    { id: 'weight_loss', icon: '🔥', label: 'Weight Loss' },
    { id: 'maintenance', icon: '⚖️', label: 'Maintenance' },
    { id: 'endurance', icon: '🏃', label: 'Endurance' },
    { id: 'flexibility', icon: '🧘', label: 'Flexibility' },
  ];
  return `
    <h2 class="onboard-title">What's your primary goal?</h2>
    <p class="onboard-sub">This shapes your calorie target, macro split, and exercise plan</p>
    <div class="select-grid select-grid-3">
      ${goals.map(g => `
        <div class="select-card ${data.goal === g.id ? 'selected' : ''}" data-goal="${g.id}">
          <div class="sc-icon">${g.icon}</div>
          <div class="sc-label">${g.label}</div>
        </div>
      `).join('')}
    </div>
    <div id="ob-err" class="err-text"></div>
    ${navButtons()}
  `;
}

function stepActivity() {
  const levels = [
    { id: 'sedentary', title: 'Sedentary', desc: 'Office job, very little exercise' },
    { id: 'light', title: 'Lightly Active', desc: 'Exercise 1-3 days/week' },
    { id: 'moderate', title: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
    { id: 'active', title: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
  ];
  return `
    <h2 class="onboard-title">How active are you?</h2>
    <p class="onboard-sub">Used to calculate your daily calorie needs (TDEE)</p>
    <div class="select-grid select-grid-2">
      ${levels.map(a => `
        <div class="select-card-wide ${data.activity === a.id ? 'selected' : ''}" data-activity="${a.id}">
          <div class="scw-title">${a.title}</div>
          <div class="scw-desc">${a.desc}</div>
        </div>
      `).join('')}
    </div>
    <div id="ob-err" class="err-text"></div>
    ${navButtons()}
  `;
}

function stepFood() {
  const regions = [
    { id: 'indian', icon: '🇮🇳', label: 'Indian' },
    { id: 'western', icon: '🇺🇸', label: 'Western' },
    { id: 'mediterranean', icon: '🇬🇷', label: 'Mediterranean' },
    { id: 'east_asian', icon: '🇯🇵', label: 'East Asian' },
    { id: 'latin', icon: '🇲🇽', label: 'Latin American' },
    { id: 'african', icon: '🌍', label: 'African' },
    { id: 'middle_eastern', icon: '🇸🇦', label: 'Middle Eastern' },
  ];
  return `
    <h2 class="onboard-title">Food preferences</h2>
    <p class="onboard-sub">We'll build meal plans from your preferred cuisine</p>
    <div class="field"><label>Cuisine Region</label></div>
    <div class="select-grid select-grid-4">
      ${regions.map(r => `
        <div class="select-card ${data.region === r.id ? 'selected' : ''}" data-region="${r.id}">
          <div class="sc-icon">${r.icon}</div>
          <div class="sc-label">${r.label}</div>
        </div>
      `).join('')}
    </div>
    <div class="grid-2" style="margin-top:1rem">
      <div class="field"><label>Diet</label>
        <select id="ob-diet">
          <option value="non-veg" ${data.diet === 'non-veg' ? 'selected' : ''}>Non-Vegetarian</option>
          <option value="veg" ${data.diet === 'veg' ? 'selected' : ''}>Vegetarian</option>
          <option value="vegan" ${data.diet === 'vegan' ? 'selected' : ''}>Vegan</option>
        </select>
      </div>
      <div class="field"><label>Daily Budget</label>
        <input type="number" id="ob-budget" value="${data.budget || 300}" placeholder="300">
      </div>
    </div>
    <div id="ob-err" class="err-text"></div>
    ${navButtons()}
  `;
}

function stepHealth() {
  return `
    <h2 class="onboard-title">Health info <span style="color:var(--text-3);font-size:.8rem;font-weight:400">(optional)</span></h2>
    <p class="onboard-sub">This helps us avoid recommending exercises or foods that could be harmful</p>
    <div class="field"><label>Any allergies or intolerances?</label>
      <input type="text" id="ob-allergies" value="${(data.allergies || []).join(', ')}" placeholder="e.g. dairy, gluten, nuts">
    </div>
    <div class="field"><label>Medical conditions</label>
      <input type="text" id="ob-medical" value="${(data.medicalConditions || []).join(', ')}" placeholder="e.g. diabetes, PCOS, thyroid">
    </div>
    <div class="grid-2">
      <div class="field"><label>Blood pressure <span class="optional">(optional)</span></label>
        <input type="text" id="ob-bp" value="${data.bloodWork?.bp || ''}" placeholder="120/80">
      </div>
      <div class="field"><label>Blood sugar <span class="optional">(mg/dL)</span></label>
        <input type="number" id="ob-sugar" value="${data.bloodWork?.sugar || ''}" placeholder="90">
      </div>
    </div>
    <div id="ob-err" class="err-text"></div>
    ${navButtons()}
  `;
}

function stepLifestyle() {
  return `
    <h2 class="onboard-title">Your lifestyle</h2>
    <p class="onboard-sub">These factors significantly impact your fitness results</p>
    <div class="grid-2">
      <div class="field"><label>Sleep hours (avg)</label>
        <input type="number" id="ob-sleep" value="${data.sleepHours || 7}" placeholder="7" step="0.5" min="3" max="12">
      </div>
      <div class="field"><label>Water intake (L/day)</label>
        <input type="number" id="ob-water" value="${data.waterIntake || 2}" placeholder="2" step="0.5">
      </div>
    </div>
    <div class="field"><label>Stress level (1-10)</label>
      <div style="display:flex;align-items:center;gap:1rem">
        <input type="range" id="ob-stress" min="1" max="10" value="${data.stressLevel || 5}" style="flex:1">
        <span id="stress-val" style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.1rem;min-width:24px;text-align:center">${data.stressLevel || 5}</span>
      </div>
    </div>
    <div class="field"><label>Available equipment</label></div>
    <div class="select-grid select-grid-3">
      ${['none', 'dumbbell', 'gym'].map(eq => `
        <div class="select-card ${(data.equipment || []).includes(eq) ? 'selected' : ''}" data-equip="${eq}">
          <div class="sc-icon">${eq === 'none' ? '🏠' : eq === 'dumbbell' ? '🏋️' : '💎'}</div>
          <div class="sc-label">${eq === 'none' ? 'No Equipment' : eq === 'dumbbell' ? 'Dumbbells' : 'Full Gym'}</div>
        </div>
      `).join('')}
    </div>
    <div id="ob-err" class="err-text"></div>
    ${navButtons()}
  `;
}

function stepTimeline() {
  return `
    <h2 class="onboard-title">Almost done! 🎉</h2>
    <p class="onboard-sub">Set your target and preferred workout schedule</p>
    <div class="grid-2">
      <div class="field"><label>Target weight (kg)</label>
        <input type="number" id="ob-target-weight" value="${data.targetWeight || ''}" placeholder="${data.goal === 'weight_loss' ? data.weight - 5 : data.weight + 3}" step="0.5">
      </div>
      <div class="field"><label>Timeline (weeks)</label>
        <input type="number" id="ob-target-weeks" value="${data.targetWeeks || 12}" placeholder="12" min="2" max="52">
      </div>
    </div>
    <div class="field"><label>Workout days per week</label></div>
    <div class="select-grid select-grid-4" style="margin-bottom:1rem">
      ${[3, 4, 5, 6].map(d => `
        <div class="select-card ${data.weeklyWorkoutDays === d ? 'selected' : ''}" data-workout-days="${d}">
          <div class="sc-icon" style="font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:800">${d}</div>
          <div class="sc-label">days</div>
        </div>
      `).join('')}
    </div>
    <div class="field"><label>Rate your fitness <span class="optional">(1-10)</span></label></div>
    <div class="grid-3" style="margin-bottom:1rem">
      <div class="field" style="margin-bottom:0">
        <label style="font-size:.72rem">Strength</label>
        <input type="range" id="ob-str" min="1" max="10" value="${data.fitnessScores?.strength || 5}">
      </div>
      <div class="field" style="margin-bottom:0">
        <label style="font-size:.72rem">Cardio</label>
        <input type="range" id="ob-cardio" min="1" max="10" value="${data.fitnessScores?.cardio || 5}">
      </div>
      <div class="field" style="margin-bottom:0">
        <label style="font-size:.72rem">Flexibility</label>
        <input type="range" id="ob-flex" min="1" max="10" value="${data.fitnessScores?.flexibility || 5}">
      </div>
    </div>
    <div id="ob-err" class="err-text"></div>
    <div class="btn-row">
      <button class="btn btn-secondary" id="ob-back">← Back</button>
      <button class="btn btn-primary" id="ob-finish" style="flex:2">Complete Setup →</button>
    </div>
  `;
}

function navButtons(showBack = true) {
  return `
    <div class="btn-row">
      ${showBack ? '<button class="btn btn-secondary" id="ob-back">← Back</button>' : ''}
      <button class="btn btn-primary" id="ob-next" style="${showBack ? 'flex:2' : 'flex:1'}">Next →</button>
    </div>
  `;
}

// ── Event binding ────────────────────────────────────────────
function bindOnboardEvents() {
  // Select cards
  document.querySelectorAll('[data-body-type]').forEach(el => {
    el.addEventListener('click', () => { data.bodyType = el.dataset.bodyType; rerender(); });
  });
  document.querySelectorAll('[data-goal]').forEach(el => {
    el.addEventListener('click', () => { data.goal = el.dataset.goal; rerender(); });
  });
  document.querySelectorAll('[data-activity]').forEach(el => {
    el.addEventListener('click', () => { data.activity = el.dataset.activity; rerender(); });
  });
  document.querySelectorAll('[data-region]').forEach(el => {
    el.addEventListener('click', () => { data.region = el.dataset.region; rerender(); });
  });
  document.querySelectorAll('[data-equip]').forEach(el => {
    el.addEventListener('click', () => {
      const eq = el.dataset.equip;
      if (!data.equipment) data.equipment = [];
      if (eq === 'none') data.equipment = ['none'];
      else {
        data.equipment = data.equipment.filter(e => e !== 'none');
        if (data.equipment.includes(eq)) data.equipment = data.equipment.filter(e => e !== eq);
        else data.equipment.push(eq);
      }
      rerender();
    });
  });
  document.querySelectorAll('[data-workout-days]').forEach(el => {
    el.addEventListener('click', () => { data.weeklyWorkoutDays = parseInt(el.dataset.workoutDays); rerender(); });
  });

  // Stress slider
  const stress = document.getElementById('ob-stress');
  const stressVal = document.getElementById('stress-val');
  if (stress && stressVal) {
    stress.addEventListener('input', () => { stressVal.textContent = stress.value; });
  }

  // Navigation
  const nextBtn = document.getElementById('ob-next');
  const backBtn = document.getElementById('ob-back');
  const finishBtn = document.getElementById('ob-finish');

  if (nextBtn) nextBtn.addEventListener('click', handleNext);
  if (backBtn) backBtn.addEventListener('click', () => { step = Math.max(1, step - 1); rerender(); });
  if (finishBtn) finishBtn.addEventListener('click', handleFinish);
}

function handleNext() {
  const err = document.getElementById('ob-err');

  switch(step) {
    case 1: {
      data.age = parseInt(document.getElementById('ob-age')?.value);
      data.gender = document.getElementById('ob-gender')?.value;
      data.weight = parseFloat(document.getElementById('ob-weight')?.value);
      data.height = parseFloat(document.getElementById('ob-height')?.value);
      if (!data.age || !data.weight || !data.height) { err.textContent = 'Please fill all fields.'; return; }
      break;
    }
    case 2: {
      if (!data.bodyType) { err.textContent = 'Please select a body type.'; return; }
      break;
    }
    case 3: {
      if (!data.goal) { err.textContent = 'Please select a goal.'; return; }
      break;
    }
    case 4: {
      if (!data.activity) { err.textContent = 'Please select your activity level.'; return; }
      break;
    }
    case 5: {
      data.diet = document.getElementById('ob-diet')?.value || 'non-veg';
      data.budget = parseInt(document.getElementById('ob-budget')?.value) || 300;
      if (!data.region) { err.textContent = 'Please select a cuisine region.'; return; }
      break;
    }
    case 6: {
      const allergiesRaw = document.getElementById('ob-allergies')?.value;
      data.allergies = allergiesRaw ? allergiesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
      const medicalRaw = document.getElementById('ob-medical')?.value;
      data.medicalConditions = medicalRaw ? medicalRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
      data.bloodWork = {
        bp: document.getElementById('ob-bp')?.value || '',
        sugar: document.getElementById('ob-sugar')?.value || '',
      };
      break;
    }
    case 7: {
      data.sleepHours = parseFloat(document.getElementById('ob-sleep')?.value) || 7;
      data.waterIntake = parseFloat(document.getElementById('ob-water')?.value) || 2;
      data.stressLevel = parseInt(document.getElementById('ob-stress')?.value) || 5;
      if (!data.equipment || !data.equipment.length) data.equipment = ['none'];
      break;
    }
  }

  step = Math.min(TOTAL_STEPS, step + 1);
  rerender();
}

async function handleFinish() {
  // Collect final step data
  data.targetWeight = parseFloat(document.getElementById('ob-target-weight')?.value) || null;
  data.targetWeeks = parseInt(document.getElementById('ob-target-weeks')?.value) || 12;
  if (!data.weeklyWorkoutDays) data.weeklyWorkoutDays = 4;
  data.fitnessScores = {
    strength: parseInt(document.getElementById('ob-str')?.value) || 5,
    cardio: parseInt(document.getElementById('ob-cardio')?.value) || 5,
    flexibility: parseInt(document.getElementById('ob-flex')?.value) || 5,
  };

  // Calculate TDEE, BMR, BMI
  const bmr = data.gender === 'female'
    ? 10 * data.weight + 6.25 * data.height - 5 * data.age - 161
    : 10 * data.weight + 6.25 * data.height - 5 * data.age + 5;
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  const tdee = Math.round(bmr * (multipliers[data.activity] || 1.55));
  const bmi = Math.round(data.weight / ((data.height / 100) ** 2) * 10) / 10;

  data.bmr = Math.round(bmr);
  data.tdee = tdee;
  data.bmi = bmi;

  try {
    const result = await api.put('/profile', data);
    const state = getState();
    state.user.profile = result.profile;
    loadUser(state.user, state.token);
    toast('Profile set up! Ready to generate your first plan 🎉');
    step = 1;
    data = {};
    navigate('dashboard');
  } catch (e) {
    toast('Failed to save profile. Try again.', 'error');
  }
}
