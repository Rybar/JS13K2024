import RetroBuffer from './core/RetroBuffer.js';
import { loadAtlas, resizeCanvas } from './core/utils.js';

document.body.style = "margin:0; background-color:black; overflow:hidden";
const w = 480, h = 270;
const atlasURL = 'DATAURL:src/img/palette.webp';

loadAtlas(atlasURL, (atlas) => {
    const r = new RetroBuffer(w, h, atlas, 10);
    window.r = r;
    document.getElementById("game").appendChild(r.c);
    resizeCanvas(r.c, w, h);
    startCountdown(r);
});

function startCountdown(r) {
    const targetDate = new Date('August 13, 2024 6:00:00').getTime(); // CEST is GMT+0200
    requestAnimationFrame(() => countdownLoop(r, targetDate));
}

function countdownLoop(r, targetDate) {
    r.clear(0); // Clear the screen

    const now = new Date().getTime();
    const distance = targetDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    const milliseconds = distance % 1000;

    // Display the countdown text
    const x = w / 2;
    const y = h / 2 - 60;
    const hspacing = 1;
    const vspacing = 3;
    const scaleLarge = 4;
    const scaleSmall = 1;
    const color = 22; // White color

    r.text(days.toString(), x - 140, y - 24, hspacing, vspacing, 'center', 'top', scaleLarge, color);
    r.text("DAYS", x - 140, y, hspacing, vspacing, 'center', 'top', scaleSmall, color);

    r.text(hours.toString(), x - 70, y - 24, hspacing, vspacing, 'center', 'top', scaleLarge, color);
    r.text("HOURS", x - 70, y, hspacing, vspacing, 'center', 'top', scaleSmall, color);

    r.text(minutes.toString(), x, y - 24, hspacing, vspacing, 'center', 'top', scaleLarge, color);
    r.text("MINUTES", x, y, hspacing, vspacing, 'center', 'top', scaleSmall, color);

    r.text(seconds.toString(), x + 70, y - 24, hspacing, vspacing, 'center', 'top', scaleLarge, color);
    r.text("SECONDS", x + 70, y, hspacing, vspacing, 'center', 'top', scaleSmall, color);

    r.text(milliseconds.toString(), x + 180, y - 24, hspacing, vspacing, 'right', 'top', scaleLarge, color);
    r.text("MS", x + 140, y, hspacing, vspacing, 'center', 'top', scaleSmall, color);

    r.render();
    requestAnimationFrame(() => countdownLoop(r, targetDate));
}
