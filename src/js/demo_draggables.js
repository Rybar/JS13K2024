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
    initInteractiveSquares(r);
});

const squares = [];
let mouseX = 0;
let mouseY = 0;
let draggedSquare = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function initInteractiveSquares(r) {
    for (let i = 0; i < 10; i++) {
        squares.push(createSquare(r.WIDTH, r.HEIGHT));
    }
    r.c.addEventListener('mousedown', (e) => onCanvasMouseDown(e, r));
    r.c.addEventListener('mousemove', (e) => onCanvasMouseMove(e, r));
    r.c.addEventListener('mouseup', (e) => onCanvasMouseUp(e, r));
    requestAnimationFrame(() => interactiveSquaresLoop(r));
}

function createSquare(maxWidth, maxHeight) {
    const size = Math.random() * 20 + 10;
    return {
        x: Math.random() * (maxWidth - size),
        y: Math.random() * (maxHeight - size),
        size,
        color: Math.floor(Math.random() * 64),
        originalColor: null
    };
}

function onCanvasMouseDown(e, r) {
    const rect = r.c.getBoundingClientRect();
    const scaleX = r.c.width / rect.width;
    const scaleY = r.c.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (const square of squares) {
        if (x >= square.x && x <= square.x + square.size && y >= square.y && y <= square.y + square.size) {
            square.originalColor = square.color;
            square.color = (square.color + 1) % 64;
            draggedSquare = square;
            dragOffsetX = x - square.x;
            dragOffsetY = y - square.y;
            break;
        }
    }
}

function onCanvasMouseMove(e, r) {
    const rect = r.c.getBoundingClientRect();
    const scaleX = r.c.width / rect.width;
    const scaleY = r.c.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;

    if (draggedSquare) {
        draggedSquare.x = mouseX - dragOffsetX;
        draggedSquare.y = mouseY - dragOffsetY;
    }
}

function onCanvasMouseUp(e, r) {
    if (draggedSquare) {
        draggedSquare.color = draggedSquare.originalColor;
        draggedSquare = null;
    }
}

function interactiveSquaresLoop(r) {
    r.clear(0, r.SCREEN);
    squares.forEach(square => {
        drawSquare(r, square);
    });
    drawCursor(r, mouseX, mouseY);
    r.render();
    requestAnimationFrame(() => interactiveSquaresLoop(r));
}

function drawSquare(r, square) {
    r.fillRect(square.x, square.y, square.size, square.size, square.color);
}

function drawCursor(r, x, y) {
    const cursorSize = 5;
    r.line(x - cursorSize, y, x + cursorSize, y, 63); // Horizontal line
    r.line(x, y - cursorSize, x, y + cursorSize, 63); // Vertical line
}
