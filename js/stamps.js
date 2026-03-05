function fillWithParticles(ctx, x, y, boundRadius, color, brushSize) {
  const density = Math.max(80, Math.floor(boundRadius * boundRadius * 0.6));
  const particleSize = brushSize * 0.12;

  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = brushSize * 0.1;

  for (let i = 0; i < density; i++) {
    const px = x + (Math.random() - 0.5) * boundRadius * 2;
    const py = y + (Math.random() - 0.5) * boundRadius * 2;
    const r = particleSize + Math.random() * particleSize * 1.8;
    ctx.globalAlpha = 0.2 + Math.random() * 0.55;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < density * 0.15; i++) {
    const px = x + (Math.random() - 0.5) * boundRadius * 1.6;
    const py = y + (Math.random() - 0.5) * boundRadius * 1.6;
    const r = particleSize * 2 + Math.random() * particleSize * 2;
    ctx.globalAlpha = 0.15 + Math.random() * 0.25;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const stampShapes = {
  'stamp-circle': (ctx, x, y, color, size) => {
    const r = size * 2.2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    fillWithParticles(ctx, x, y, r, color, size);
    ctx.restore();
  },

  'stamp-triangle': (ctx, x, y, color, size) => {
    const r = size * 2.4;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * Math.cos(Math.PI / 6), y + r * Math.sin(Math.PI / 6));
    ctx.lineTo(x - r * Math.cos(Math.PI / 6), y + r * Math.sin(Math.PI / 6));
    ctx.closePath();
    ctx.clip();
    fillWithParticles(ctx, x, y, r, color, size);
    ctx.restore();
  },

  'stamp-star': (ctx, x, y, color, size) => {
    const outerR = size * 2.5;
    const innerR = outerR * 0.4;
    const points = 5;
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (Math.PI / 2 * -1) + (Math.PI / points) * i;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.clip();
    fillWithParticles(ctx, x, y, outerR, color, size);
    ctx.restore();
  },

  'stamp-heart': (ctx, x, y, color, size) => {
    const s = size * 0.14;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(-1, -18, -22, -18, -22, -4);
    ctx.bezierCurveTo(-22, 8, 0, 22, 0, 28);
    ctx.bezierCurveTo(0, 22, 22, 8, 22, -4);
    ctx.bezierCurveTo(22, -18, 1, -18, 0, -6);
    ctx.closePath();
    ctx.clip();
    ctx.scale(1 / s, 1 / s);
    ctx.translate(-x, -y);
    fillWithParticles(ctx, x, y, size * 2.5, color, size);
    ctx.restore();
  }
};

export function drawStamp(ctx, tool, x, y, color, brushSize) {
  const drawFn = stampShapes[tool];
  if (!drawFn) return;

  ctx.save();
  drawFn(ctx, x, y, color, brushSize);
  ctx.restore();
}

export function getStampNames() {
  return Object.keys(stampShapes);
}
