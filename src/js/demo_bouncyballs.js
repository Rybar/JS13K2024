import RetroBuffer from './core/RetroBuffer.js';
import { loadAtlas, resizeCanvas } from './core/utils.js';

document.body.style = "margin:0; background-color:black; overflow:hidden; cursor:none";
const w = 480, h = 270;
const atlasURL = 'DATAURL:src/img/palette.webp';

loadAtlas(atlasURL, (atlas) => {
    const r = new RetroBuffer(w, h, atlas, 10);
    window.r = r;
    document.body.appendChild(r.c);
    resizeCanvas(r.c, w, h);
    initInteractiveBalls(r);
});

const balls = [];
let mouseX = 0;
let mouseY = 0;

function initInteractiveBalls(r) {
    for (let i = 0; i < 10; i++) {
        balls.push(createBall(r.WIDTH, r.HEIGHT));
    }
    r.c.addEventListener('click', (e) => onCanvasClick(e, r));
    r.c.addEventListener('mousemove', (e) => onCanvasMouseMove(e, r));
    requestAnimationFrame(() => interactiveBallsLoop(r));
}

function createBall(maxWidth, maxHeight) {
    return {
        x: Math.random() * maxWidth,
        y: Math.random() * maxHeight,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius: Math.random() * 5 + 2,
        color: Math.floor(Math.random() * 64)
    };
}

function onCanvasClick(e, r) {
    const rect = r.c.getBoundingClientRect();
    const scaleX = r.c.width / rect.width;
    const scaleY = r.c.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    balls.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius: Math.random() * 5 + 2,
        color: Math.floor(Math.random() * 64)
    });
}

function onCanvasMouseMove(e, r) {
    const rect = r.c.getBoundingClientRect();
    const scaleX = r.c.width / rect.width;
    const scaleY = r.c.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
}

function interactiveBallsLoop(r) {
    r.clear(0, r.SCREEN);
    balls.forEach((ball, index) => {
        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.x - ball.radius < 0 || ball.x + ball.radius > r.WIDTH) {
            ball.vx *= -1;
            ball.color = (ball.color + 1) % 64;
        }
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > r.HEIGHT) {
            ball.vy *= -1;
            ball.color = (ball.color + 1) % 64;
        }

        // Collision detection
        for (let i = index + 1; i < balls.length; i++) {
            const otherBall = balls[i];
            if (isColliding(ball, otherBall)) {
                resolveCollision(ball, otherBall);
            }
        }

        drawBall(r, ball);
    });
    drawCursor(r, mouseX, mouseY);
    r.render();
    requestAnimationFrame(() => interactiveBallsLoop(r));
}

function isColliding(ball1, ball2) {
    const dx = ball1.x + ball1.vx - (ball2.x + ball2.vx);
    const dy = ball1.y + ball1.vy - (ball2.y + ball2.vy);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < ball1.radius + ball2.radius;
}

function resolveCollision(ball1, ball2) {
    const dx = ball1.x - ball2.x;
    const dy = ball1.y - ball2.y;
    const collisionAngle = Math.atan2(dy, dx);

    const speed1 = Math.sqrt(ball1.vx * ball1.vx + ball1.vy * ball1.vy);
    const speed2 = Math.sqrt(ball2.vx * ball2.vx + ball2.vy * ball2.vy);

    const direction1 = Math.atan2(ball1.vy, ball1.vx);
    const direction2 = Math.atan2(ball2.vy, ball2.vx);

    const velocityX1 = speed1 * Math.cos(direction1 - collisionAngle);
    const velocityY1 = speed1 * Math.sin(direction1 - collisionAngle);
    const velocityX2 = speed2 * Math.cos(direction2 - collisionAngle);
    const velocityY2 = speed2 * Math.sin(direction2 - collisionAngle);

    const finalVelocityX1 = ((ball1.radius - ball2.radius) * velocityX1 + (ball2.radius + ball2.radius) * velocityX2) / (ball1.radius + ball2.radius);
    const finalVelocityX2 = ((ball1.radius + ball1.radius) * velocityX1 + (ball2.radius - ball1.radius) * velocityX2) / (ball1.radius + ball2.radius);

    ball1.vx = Math.cos(collisionAngle) * finalVelocityX1 + Math.cos(collisionAngle + Math.PI / 2) * velocityY1;
    ball1.vy = Math.sin(collisionAngle) * finalVelocityX1 + Math.sin(collisionAngle + Math.PI / 2) * velocityY1;
    ball2.vx = Math.cos(collisionAngle) * finalVelocityX2 + Math.cos(collisionAngle + Math.PI / 2) * velocityY2;
    ball2.vy = Math.sin(collisionAngle) * finalVelocityX2 + Math.sin(collisionAngle + Math.PI / 2) * velocityY2;
}

function drawBall(r, ball) {
    r.fillCircle(ball.x, ball.y, ball.radius, ball.color);
}

function drawCursor(r, x, y) {
    const cursorSize = 5;
    r.line(x - cursorSize, y, x + cursorSize, y, 63); // Horizontal line
    r.line(x, y - cursorSize, x, y + cursorSize, 63); // Vertical line
}
