// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Canvas Chart Components
// Line chart, radial progress, contribution calendar
// ═══════════════════════════════════════════════════════════════

/**
 * Render a line chart on a canvas element
 * @param {string} canvasId - Canvas element ID
 * @param {number[]} data - Array of values
 * @param {string[]} labels - Array of labels
 * @param {object} opts - { color, fillColor, showDots, showGrid, unit }
 */
export function drawLineChart(canvasId, data, labels, opts = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !data.length) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const pad = { top: 20, right: 20, bottom: 30, left: 45 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const color = opts.color || '#6C63FF';
  const fillColor = opts.fillColor || 'rgba(108,99,255,0.08)';

  const min = Math.min(...data) * 0.98;
  const max = Math.max(...data) * 1.02;
  const range = max - min || 1;

  const getX = (i) => pad.left + (i / (data.length - 1)) * plotW;
  const getY = (v) => pad.top + plotH - ((v - min) / range) * plotH;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();

    // Y-axis labels
    const val = max - (range / 4) * i;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '11px Inter,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(val)}${opts.unit || ''}`, pad.left - 8, y + 4);
  }

  // X-axis labels
  if (labels.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '10px Inter,sans-serif';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(labels.length / 6));
    labels.forEach((l, i) => {
      if (i % step === 0 || i === labels.length - 1) {
        ctx.fillText(l, getX(i), h - 8);
      }
    });
  }

  // Fill area
  ctx.beginPath();
  ctx.moveTo(getX(0), getY(data[0]));
  data.forEach((v, i) => {
    if (i === 0) return;
    // Smooth curve
    const prevX = getX(i - 1);
    const currX = getX(i);
    const cpx = (prevX + currX) / 2;
    ctx.bezierCurveTo(cpx, getY(data[i - 1]), cpx, getY(v), currX, getY(v));
  });
  ctx.lineTo(getX(data.length - 1), pad.top + plotH);
  ctx.lineTo(getX(0), pad.top + plotH);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(getX(0), getY(data[0]));
  data.forEach((v, i) => {
    if (i === 0) return;
    const prevX = getX(i - 1);
    const currX = getX(i);
    const cpx = (prevX + currX) / 2;
    ctx.bezierCurveTo(cpx, getY(data[i - 1]), cpx, getY(v), currX, getY(v));
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dots
  if (opts.showDots !== false) {
    data.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(getX(i), getY(v), 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(getX(i), getY(v), 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    });
  }
}

/**
 * Render a radial progress ring using SVG string
 * @param {number} percent - 0-100
 * @param {string} label - Center label
 * @param {string} color - Stroke color
 * @param {number} size - SVG size
 */
export function progressRing(percent, label, color = '#6C63FF', size = 100) {
  const r = (size - 12) / 2;
  const c = Math.PI * 2 * r;
  const offset = c - (percent / 100) * c;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="6"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"
        style="transition:stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)"/>
    </svg>
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(0)">
      <div style="font-family:'Syne',sans-serif;font-size:${size / 5}px;font-weight:800;color:${color}">${Math.round(percent)}%</div>
      ${label ? `<div style="font-size:${size / 10}px;color:var(--text-3);margin-top:2px">${label}</div>` : ''}
    </div>
  `;
}

/**
 * Generate contribution calendar HTML
 * @param {string[]} dates - Array of ISO date strings where activity occurred
 * @param {number} weeks - Number of weeks to show
 */
export function contributionCalendar(dates, weeks = 12) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateSet = new Set(dates.map(d => new Date(d).toDateString()));
  const days = weeks * 7;
  let html = '';

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const active = dateSet.has(d.toDateString());
    const level = active ? 'l3' : '';
    const isToday = i === 0 ? 'today' : '';
    html += `<div class="contrib-cell ${level} ${isToday}" title="${d.toLocaleDateString()}"></div>`;
  }

  return `<div class="contrib-grid">${html}</div>`;
}
