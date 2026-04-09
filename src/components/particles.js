// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Particle Background System
// Lightweight floating particles with connections
// ═══════════════════════════════════════════════════════════════

let canvas, ctx, particles, animId, mouse;

export function initParticles() {
  canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  mouse = { x: -1000, y: -1000 };
  particles = [];

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  // Create particles
  const count = Math.min(Math.floor(window.innerWidth * window.innerHeight / 18000), 60);
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.3 + 0.1,
      color: Math.random() > 0.7 ? '108,99,255' : Math.random() > 0.5 ? '34,201,106' : '0,212,255',
    });
  }

  animate();
}

function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function animate() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    // Subtle mouse interaction
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 150) {
      p.vx -= dx * 0.00003;
      p.vy -= dy * 0.00003;
    }

    // Move
    p.x += p.vx;
    p.y += p.vy;

    // Bounce
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    // Draw particle
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
    ctx.fill();
  });

  // Draw connections
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(108,99,255,${0.06 * (1 - dist / 120)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  animId = requestAnimationFrame(animate);
}
