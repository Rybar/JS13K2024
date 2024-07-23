import RetroBuffer from './core/RetroBuffer.js';
import { resizeCanvas } from './core/utils.js';

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
    initPlasma(r);
    resizeCanvas(r.c, w, h);
};

let time = 0;

function initPlasma(r) {
    requestAnimationFrame(() => plasmaLoop(r));
}

function plasmaLoop(r) {
    time += 0.02;
    for (let y = 0; y < r.HEIGHT; y++) {
        for (let x = 0; x < r.WIDTH; x++) {
            const { color1, color2, pattern } = getPlasmaColor(x, y, time);
            r.pat = r.dither[pattern];
            r.pset(x, y, color1, color2);
        }
    }
    r.render();
    requestAnimationFrame(() => plasmaLoop(r));
}

function getPlasmaColor(x, y, time) {
    const value = Math.sin(x * 0.03 + time) +
                  Math.sin(y * 0.03 + time) +
                  Math.sin((x + y) * 0.01 + time) +
                  Math.sin(Math.sqrt(x * x + y * y) * 0.01 + time);

    const colorValue = Math.floor((value + 4) * 128) % (64*16);
    const colorIndex1 = Math.floor(colorValue / 16);
    const colorIndex2 = Math.ceil(colorValue / 16);
    const pattern = colorValue % 16;
    return { color1: colorIndex1, color2: colorIndex2, pattern };
}
