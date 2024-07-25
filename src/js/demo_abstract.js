import RetroBuffer from './core/RetroBuffer.js';
import { loadAtlas, resizeCanvas, PerlinNoise } from './core/utils.js';

document.body.style = "margin:0; background-color:black; overflow:hidden";
const w = 480, h = 270;
const buffer = 100; // Buffer for smoother wrapping
const atlasURL = 'DATAURL:src/img/palette.webp';

loadAtlas(atlasURL, (atlas) => {
  const r = new RetroBuffer(w, h, atlas, 10);
  window.r = r;
  document.body.appendChild(r.c);
  resizeCanvas(r.c, w, h);
  preGenerateNoise();
  generateElements();
  animateAbstractArt(r);
});

let time = 0;
const noiseValues = [];
const elements = {
  lines: [],
  circles: [],
  rectangles: [],
  triangles: [],
  gradCircles: [],
  gradRectangles: [],
  gradTriangles: []
};

function preGenerateNoise() {
  const perlin = new PerlinNoise();
  perlin.seed();
  for (let y = 0; y < h; y++) {
    noiseValues[y] = [];
    for (let x = 0; x < w; x++) {
      const value = (perlin.get(x * 0.05, y * 0.05) + 1) * 0.5;
      const colorIndex = Math.floor(value * 63);
      noiseValues[y][x] = colorIndex;
    }
  }
}

function generateElements() {
  const maxDistance = 20;  // Maximum distance for triangle vertices from the center

  for (let i = 0; i < 10; i++) {
    elements.lines.push({
      x1: Math.random() * w,
      y1: Math.random() * h,
      x2: Math.random() * w,
      y2: Math.random() * h,
      color: Math.floor(Math.random() * 64)
    });

    elements.circles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 20 + 10,
      color: Math.floor(Math.random() * 64)
    });

    elements.rectangles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      width: Math.random() * 40 + 10,
      height: Math.random() * 40 + 10,
      color: Math.floor(Math.random() * 64)
    });

    const centerX = Math.random() * w;
    const centerY = Math.random() * h;
    elements.triangles.push({
      centerX,
      centerY,
      vertices: [
        {x: centerX + (Math.random() * 2 - 1) * maxDistance, y: centerY + (Math.random() * 2 - 1) * maxDistance},
        {x: centerX + (Math.random() * 2 - 1) * maxDistance, y: centerY + (Math.random() * 2 - 1) * maxDistance},
        {x: centerX + (Math.random() * 2 - 1) * maxDistance, y: centerY + (Math.random() * 2 - 1) * maxDistance}
      ],
      color: Math.floor(Math.random() * 64)
    });

    elements.gradCircles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 20 + 10,
      color1: Math.floor(Math.random() * 64),
      color2: Math.floor(Math.random() * 64),
      angle: Math.random() * 360
    });

    elements.gradRectangles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      width: Math.random() * 40 + 10,
      height: Math.random() * 40 + 10,
      color1: Math.floor(Math.random() * 64),
      color2: Math.floor(Math.random() * 64),
      angle: Math.random() * 360
    });

    elements.gradTriangles.push({
      centerX: centerX,
      centerY: centerY,
      vertices: [
        {x: centerX + (Math.random() * 2 - 1) * maxDistance, y: centerY + (Math.random() * 2 - 1) * maxDistance},
        {x: centerX + (Math.random() * 2 - 1) * maxDistance, y: centerY + (Math.random() * 2 - 1) * maxDistance},
        {x: centerX + (Math.random() * 2 - 1) * maxDistance, y: centerY + (Math.random() * 2 - 1) * maxDistance}
      ],
      color1: Math.floor(Math.random() * 64),
      color2: Math.floor(Math.random() * 64),
      angle: Math.random() * 360
    });
  }
}

function animateAbstractArt(r) {
  time += 0.02;

  // Clear the screen
  r.clear(0, r.SCREEN);

  // Animate the pre-generated noise-based background
  for (let y = 0; y < r.HEIGHT; y++) {
    for (let x = 0; x < r.WIDTH; x++) {
      const shiftedX = (x + Math.floor(time * 20)) % r.WIDTH;
      const shiftedY = (y + Math.floor(time * 20)) % r.HEIGHT;
      const colorIndex = noiseValues[shiftedY][shiftedX];
      r.pset(x, y, colorIndex);
    }
  }

  // Draw lines
  elements.lines.forEach(line => {
    r.line((line.x1 + time * 50) % (r.WIDTH + buffer) - buffer / 2, line.y1, (line.x2 + time * 50) % (r.WIDTH + buffer) - buffer / 2, line.y2, line.color);
  });

  // Draw circles
  elements.circles.forEach(circle => {
    r.fillCircle((circle.x + time * 30) % (r.WIDTH + buffer) - buffer / 2, circle.y, circle.radius, circle.color);
  });

  // Draw rectangles
  elements.rectangles.forEach(rect => {
    r.fillRect((rect.x + time * 40) % (r.WIDTH + buffer) - buffer / 2, rect.y, rect.width, rect.height, rect.color);
  });

  // Draw triangles
  elements.triangles.forEach(tri => {
    const newX = (tri.centerX + time * 20) % (r.WIDTH + buffer) - buffer / 2;
    const newY = tri.centerY;
    r.fillTriangle(
      {x: newX + (tri.vertices[0].x - tri.centerX), y: newY + (tri.vertices[0].y - tri.centerY)},
      {x: newX + (tri.vertices[1].x - tri.centerX), y: newY + (tri.vertices[1].y - tri.centerY)},
      {x: newX + (tri.vertices[2].x - tri.centerX), y: newY + (tri.vertices[2].y - tri.centerY)},
      tri.color
    );
  });

  // Draw gradient circles
  elements.gradCircles.forEach(circle => {
    r.gradCircle((circle.x + time * 60) % (r.WIDTH + buffer) - buffer / 2, circle.y, circle.radius, circle.color1, circle.color2, circle.angle);
  });

  // Draw gradient rectangles
  elements.gradRectangles.forEach(rect => {
    r.gradRect((rect.x + time * 70) % (r.WIDTH + buffer) - buffer / 2, rect.y, rect.width, rect.height, rect.color1, rect.color2, rect.angle);
  });

  // Draw gradient triangles
  elements.gradTriangles.forEach(tri => {
    const newX = (tri.centerX + time * 80) % (r.WIDTH + buffer) - buffer / 2;
    const newY = tri.centerY;
    r.gradTriangle(
      {x: newX + (tri.vertices[0].x - tri.centerX), y: newY + (tri.vertices[0].y - tri.centerY)},
      {x: newX + (tri.vertices[1].x - tri.centerX), y: newY + (tri.vertices[1].y - tri.centerY)},
      {x: newX + (tri.vertices[2].x - tri.centerX), y: newY + (tri.vertices[2].y - tri.centerY)},
      tri.color1, tri.color2, tri.angle
    );
  });

  r.render();
  requestAnimationFrame(() => animateAbstractArt(r));
}
