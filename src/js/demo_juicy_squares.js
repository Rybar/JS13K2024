import RetroBuffer from './core/RetroBuffer.js';
import { loadAtlas, resizeCanvas, Key } from './core/utils.js';

document.body.style = "margin:0; background-color:black; overflow:hidden; cursor:none";
const w = 480, h = 270;
const atlasURL = 'DATAURL:src/img/palette.webp';

loadAtlas(atlasURL, (atlas) => {
    const r = new RetroBuffer(w, h, atlas, 10);
    window.r = r;
    document.body.appendChild(r.c);
    resizeCanvas(r.c, w, h);
    initGame(r);
});

let player;
const squares = [];
const enemySquares = [];
const particles = [];
let score = 0;
let lives = 3;
const numSquares = 10;
const numEnemySquares = 5;
let shakeTime = 0;
let gameOver = false;

function initGame(r) {
    player = createSquare(r.WIDTH / 2, r.HEIGHT / 2, 20, 10, 2, 2); // Blue (10) player with white outline
    for (let i = 0; i < numSquares; i++) {
        squares.push(createSquare(Math.random() * r.WIDTH, Math.random() * r.HEIGHT, Math.random() * 15 + 10, Math.floor(Math.random() * 64), (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4));
    }
    for (let i = 0; i < numEnemySquares; i++) {
        enemySquares.push(createSquare(Math.random() * r.WIDTH, Math.random() * r.HEIGHT, Math.random() * 15 + 10, 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4)); // Red (4) enemy squares
    }
    window.addEventListener('keydown', (e) => Key.onKeydown(e));
    window.addEventListener('keyup', (e) => Key.onKeyup(e));
    requestAnimationFrame(() => gameLoop(r));
}

function createSquare(x, y, size, color, vx, vy) {
    return {
        x,
        y,
        size,
        color,
        vx,
        vy
    };
}

function createParticle(x, y, color) {
    return {
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 30,
        color
    };
}

function gameLoop(r) {
    if (gameOver) {
        drawGameOver(r);
        r.render();
        return;
    }

    r.clear(0, r.SCREEN);

    // Move player
    if (Key.isDown(Key.LEFT) || Key.isDown(Key.a)) player.x -= 2;
    if (Key.isDown(Key.RIGHT) || Key.isDown(Key.d)) player.x += 2;
    if (Key.isDown(Key.UP) || Key.isDown(Key.w)) player.y -= 2;
    if (Key.isDown(Key.DOWN) || Key.isDown(Key.s)) player.y += 2;

    // Keep player within bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.size > r.WIDTH) player.x = r.WIDTH - player.size;
    if (player.y < 0) player.y = 0;
    if (player.y + player.size > r.HEIGHT) player.y = r.HEIGHT - player.size;

    // Update and draw background animation
    drawBackground(r);

    // Draw and update squares
    squares.forEach((square, index) => {
        square.x += square.vx;
        square.y += square.vy;

        if (square.x < 0 || square.x + square.size > r.WIDTH) {
            square.vx *= -1;
            square.color = (square.color + 1) % 64;
        }
        if (square.y < 0 || square.y + square.size > r.HEIGHT) {
            square.vy *= -1;
            square.color = (square.color + 1) % 64;
        }

        // Color cycling
        square.color = (square.color + 0.1) % 64;

        drawSquare(r, square);

        if (isColliding(player, square)) {
            score++;
            player.size += 1;
            shakeTime = 10;
            generateParticles(square.x + square.size / 2, square.y + square.size / 2, square.color);
            squares.splice(index, 1);
            squares.push(createSquare(Math.random() * r.WIDTH, Math.random() * r.HEIGHT, Math.random() * 15 + 10, Math.floor(Math.random() * 64), (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4));
        }
    });

    // Draw and update enemy squares
    enemySquares.forEach((square, index) => {
        square.x += square.vx;
        square.y += square.vy;

        if (square.x < 0 || square.x + square.size > r.WIDTH) {
            square.vx *= -1;
        }
        if (square.y < 0 || square.y + square.size > r.HEIGHT) {
            square.vy *= -1;
        }

        drawSquare(r, square);

        if (isColliding(player, square)) {
            lives--;
            shakeTime = 20;
            if (lives <= 0) {
                gameOver = true;
            }
            enemySquares.splice(index, 1);
            enemySquares.push(createSquare(Math.random() * r.WIDTH, Math.random() * r.HEIGHT, Math.random() * 15 + 10, 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4));
        }
    });

    // Update and draw particles
    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        if (particle.life <= 0) {
            particles.splice(index, 1);
        } else {
            r.pset(particle.x, particle.y, particle.color);
        }
    });

    // Draw player with trailing effect and white outline
    drawSquare(r, player);
    r.fillRect(player.x - 2, player.y - 2, player.size + 4, player.size + 4, 22); // White outline (22)
    drawSquare(r, player);

    // Draw score with animation
    drawScore(r);

    // Draw lives
    drawLives(r);

    // Apply screen shake
    if (shakeTime > 0) {
        shakeTime--;
        r.ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
    }

    r.render();
    Key.update();
    requestAnimationFrame(() => gameLoop(r));
}

function isColliding(square1, square2) {
    return !(square2.x > square1.x + square1.size ||
        square2.x + square2.size < square1.x ||
        square2.y > square1.y + square1.size ||
        square2.y + square2.size < square1.y);
}

function drawSquare(r, square) {
    r.fillRect(square.x, square.y, square.size, square.size, square.color);
}

function drawBackground(r) {
    for (let x = 0; x < r.WIDTH; x += 10) {
        for (let y = 0; y < r.HEIGHT; y += 10) {
            const color = (x + y + Math.floor(Date.now() / 100)) % 64;
            r.pset(x, y, color);
        }
    }
}

function generateParticles(x, y, color) {
    for (let i = 0; i < 40; i++) {
        particles.push(createParticle(x, y, color));
    }
}

function drawScore(r) {
    const scoreStr = `SCORE: ${score}`;
    for (let i = 0; i < scoreStr.length; i++) {
        const char = scoreStr[i];
        const x = 10 + i * 6;
        const y = 10 + Math.sin(Date.now() / 200 + i) * 2;
        r.text(char, x, y, 1, 1, 'left', 'top', 1, 22); // White score (22)
    }
}

function drawLives(r) {
    const livesStr = `LIVES: ${lives}`;
    for (let i = 0; i < livesStr.length; i++) {
        const char = livesStr[i];
        const x = 10 + i * 6;
        const y = 30;
        r.text(char, x, y, 1, 1, 'left', 'top', 1, 22); // White lives (22)
    }
}

function drawGameOver(r) {
    const gameOverStr = `GAME OVER`;
    for (let i = 0; i < gameOverStr.length; i++) {
        const char = gameOverStr[i];
        const x = r.WIDTH / 2 - gameOverStr.length * 3 + i * 6;
        const y = r.HEIGHT / 2;
        r.text(char, x, y, 1, 1, 'left', 'top', 1, 4); // Red game over (4)
    }
    const scoreStr = `SCORE: ${score}`;
    for (let i = 0; i < scoreStr.length; i++) {
        const char = scoreStr[i];
        const x = r.WIDTH / 2 - scoreStr.length * 3 + i * 6;
        const y = r.HEIGHT / 2 + 10;
        r.text(char, x, y, 1, 1, 'left', 'top', 1, 22); // White score (22)
    }
}
