// Neon-glow rectangle border (brand "Holding Devices" style).
// Three layered strokes: wide outer halo → mid glow → bright inner edge.
// cx/cy is the center of the rectangle.
export function drawNeonRect(gfx, cx, cy, w, h, color, intensity = 1.0) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  gfx.lineStyle(14, color, 0.07 * intensity);
  gfx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  gfx.lineStyle(4, color, 0.28 * intensity);
  gfx.strokeRect(x, y, w, h);
  gfx.lineStyle(1.5, color, 0.9 * intensity);
  gfx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

// Brand "Expressive GFX" light-streak background approximation.
// Renders layered diagonal lines (outer glow → inner glow → core → spine)
// to mimic the sweeping light streaks on the Vegas Infinite brand cover.
// Always call immediately after the black background rectangle so streaks
// sit behind all UI elements.

const STREAKS = [
  { x: -180, angle: 38, color: 0xfc6b23, intensity: 0.7 },
  { x:   80, angle: 35, color: 0xfb009f, intensity: 0.5 },
  { x:  320, angle: 42, color: 0x9500c6, intensity: 0.55 },
  { x:  620, angle: 36, color: 0xfc6b23, intensity: 0.35 },
  { x:  870, angle: 40, color: 0x173dff, intensity: 0.55 },
  { x: 1080, angle: 37, color: 0xfb009f, intensity: 0.5 },
  { x: 1340, angle: 41, color: 0x2afeff, intensity: 0.45 },
];

export function drawLightStreaks(scene) {
  const gfx = scene.add.graphics();
  const H = scene.scale.height;

  for (const s of STREAKS) {
    const rad = (s.angle * Math.PI) / 180;
    const dx = H / Math.tan(rad);
    const x1 = s.x;
    const y1 = H;
    const x2 = s.x + dx;
    const y2 = 0;
    const i = s.intensity;

    // Four layers: wide halo → mid glow → bright core → hot spine
    gfx.lineStyle(64, s.color, 0.04 * i);
    gfx.lineBetween(x1, y1, x2, y2);

    gfx.lineStyle(22, s.color, 0.10 * i);
    gfx.lineBetween(x1, y1, x2, y2);

    gfx.lineStyle(5, s.color, 0.45 * i);
    gfx.lineBetween(x1, y1, x2, y2);

    gfx.lineStyle(1, 0xffffff, 0.55 * i);
    gfx.lineBetween(x1, y1, x2, y2);
  }
}
