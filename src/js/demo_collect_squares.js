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
let score = 0;
const numSquares = 5;

function initGame(r) {
    player = createSquare(r.WIDTH / 2, r.HEIGHT / 2, 20, 15, 2, 2);
    for (let i = 0; i < numSquares; i++) {
        squares.push(createSquare(Math.random() * r.WIDTH, Math.random() * r.HEIGHT, 10, Math.floor(Math.random() * 64), (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4));
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

function gameLoop(r) {
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

        drawSquare(r, square);

        if (isColliding(player, square)) {
            score++;
            player.size += 1;
            squares.splice(index, 1);
            squares.push(createSquare(Math.random() * r.WIDTH, Math.random() * r.HEIGHT, 10, Math.floor(Math.random() * 64), (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4));
        }
    });

    // Draw player
    drawSquare(r, player);

    // Draw score
    r.text(`Score: ${score}`, 10, 10, 1, 1, 'left', 'top', 1, 63);

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
