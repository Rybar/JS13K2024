import RetroBuffer from './core/RetroBuffer.js';
import { resizeCanvas } from './core/utils.js';
import AnimLine from './gfx/AnimLine.js';
import Splode from './gfx/Splode.js'; 

document.body.style = "margin:0; background-color:black; overflow:hidden";
const w = 480, h = 270;
const atlasURL = 'DATAURL:src/img/palette.webp';
const atlasImage = new Image();
atlasImage.src = atlasURL;

atlasImage.onload = function () {
    let c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    let ctx = c.getContext('2d');
    ctx.drawImage(this, 0, 0);
    const atlas = new Uint32Array(ctx.getImageData(0, 0, 64, 64).data.buffer);
    const r = new RetroBuffer(w, h, atlas, 10);
    window.r = r;
    document.body.appendChild(r.c);
    initGame(r);
    resizeCanvas(r.c, w, h);
};

class Missile {
  constructor(buffer, x1, y1, x2, y2, color, speed) {
    this.line = new AnimLine(buffer, x1, y1, x2, y2, color, speed);
    this.x2 = x2;
    this.y2 = y2;
  }

  update() {
    this.line.update();
  }

  draw() {
    this.line.draw();
  }

  get alive() {
    return this.line.alive;
  }

  get x() {
    return this.line.x1 + (this.line.x2 - this.line.x1) * (this.line.progress / this.line.totalLength);
  }

  get y() {
    return this.line.y1 + (this.line.y2 - this.line.y1) * (this.line.progress / this.line.totalLength);
  }
}

function initGame(buffer) {
  const missiles = [];
  const enemyMissiles = [];
  const explosions = [];
  const bases = [{ x: 240, y: 250 }]; // Example base
  const cities = [
    { x: 80, y: 250, alive: true },
    { x: 160, y: 250, alive: true },
    { x: 320, y: 250, alive: true },
    { x: 400, y: 250, alive: true }
  ];

  function updateGame() {
    for (let i = missiles.length - 1; i >= 0; i--) {
      const missile = missiles[i];
      missile.update();
      if (!missile.alive) {
        missiles.splice(i, 1);
        explosions.push(new Splode(missile.x2, missile.y2, 20, 7));
      }
    }

    for (let i = enemyMissiles.length - 1; i >= 0; i--) {
      const enemyMissile = enemyMissiles[i];
      enemyMissile.update();
      if (!enemyMissile.alive) {
        enemyMissiles.splice(i, 1);
        explosions.push(new Splode(enemyMissile.x2, enemyMissile.y2, 20, 7));
      }
    }

    for (let i = explosions.length - 1; i >= 0; i--) {
      const explosion = explosions[i];
      explosion.update();
      if (!explosion.alive) {
        explosions.splice(i, 1);
      }
    }

    checkCollisions();
  }

  function drawGame() {
    for (const missile of missiles) {
      missile.draw();
    }

    for (const enemyMissile of enemyMissiles) {
      enemyMissile.draw();
    }

    for (const explosion of explosions) {
      explosion.draw(buffer, { x: 0, y: 0 });
    }

    for (const base of bases) {
      buffer.fillRect(base.x - 5, base.y - 5, 10, 10, 2);
    }

    for (const city of cities) {
      if (city.alive) {
        buffer.fillRect(city.x - 5, city.y - 5, 10, 10, 3);
      }
    }
  }

  function checkCollisions() {
    for (const explosion of explosions) {
      for (const enemyMissile of enemyMissiles) {
        if (isColliding(enemyMissile, explosion)) {
          enemyMissile.alive = false;
        }
      }
    }

    for (const explosion of explosions) {
      for (const city of cities) {
        if (city.alive && isColliding(city, explosion)) {
          city.alive = false;
          explosion.alive = false;
        }
      }
    }
  }

  function isColliding(object, explosion) {
    const dx = object.x - explosion.x;
    const dy = object.y - explosion.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < explosion.lifeMax;
  }

  document.addEventListener('click', (event) => {
    const rect = buffer.c.getBoundingClientRect();
    const scaleX = buffer.WIDTH / rect.width;
    const scaleY = buffer.HEIGHT / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const base = bases[0];
    missiles.push(new Missile(buffer, base.x, base.y, x, y, 5, 2));
  });

  function spawnEnemyMissile() {
    const startX = Math.random() * buffer.WIDTH;
    const target = cities.concat(bases).filter(obj => obj.alive);
    const targetIndex = Math.floor(Math.random() * target.length);
    const targetX = target[targetIndex].x;
    const targetY = target[targetIndex].y;

    enemyMissiles.push(new Missile(buffer, startX, 0, targetX, targetY, 8, 0.1));
  }

  function mainLoop() {
    buffer.clear(0, 0);

    updateGame();
    drawGame();

    buffer.render();

    requestAnimationFrame(mainLoop);
  }

  setInterval(spawnEnemyMissile, 1000); // Spawn enemy missiles every second
  mainLoop();
}
