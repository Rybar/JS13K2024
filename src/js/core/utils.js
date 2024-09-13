export function rand(min, max) {
  return Math.floor(Math.random() * (max + 1 - min) + min);
};

export function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

export function choice(values) {
  return values[rand(0, values.length - 1)];
};

export function lerp(a, b, x){
   return a + (b -a ) * x;
}

export function inView(o, padding=0){
  return o.x - view.x + padding > 0 &&
         o.y - view.y + padding > 0 &&
         o.x - view.x - padding < screenWidth &&
         o.y - view.y - padding < screenHeight
}

export function callOnce(fn){
  let called = false;
  return function(){
    if(called) return;
    called = true;
    fn();
  }
}

export function getPan(entity){
  return (entity.x - view.x) / screenWidth * 2 - 1;
}

export function radians(degrees) {
  return degrees * Math.PI / 180;
}

export function lightRadial(cx, cy, radius, colors=[0,1,2,3]){
  //draw halo on lights layer
  r.renderTarget = r["PAGE7"];
  r.paintTransparent = true;
  r.lightMode = true;
  r.radialCircle(cx, cy, radius, colors);
  r.renderTarget = r["SCREEN"];
  r.paintTransparent = false;
  r.lightMode = false;
  }

export function tileCollisionCheck(map, entity) {
  if(map.getTileAtPixel(entity.x, entity.y) === 0 |
      map.getTileAtPixel(entity.x+entity.width, entity.y) === 0 |
      map.getTileAtPixel(entity.x, entity.y-entity.height) === 0 |
      map.getTileAtPixel(entity.x+entity.width, entity.y-entity.height) === 0) {
      return true
  }
  return false
}

export function playSound(buffer, playbackRate = 1, pan = 0, volume = .5, loop = false) {

  var source = window.audioCtx.createBufferSource();
  var gainNode = window.audioCtx.createGain();
  var panNode = window.audioCtx.createStereoPanner();

  source.buffer = buffer;
  source.connect(panNode);
  panNode.connect(gainNode);
  gainNode.connect(audioMaster);

  source.playbackRate.value = playbackRate;
  source.loop = loop;
  gainNode.gain.value = volume;
  panNode["pan"].value = pan;
  source.start();
  return {volume: gainNode, sound: source};

}

export const Key = {

  pressed: {},
  released: {},

  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  ONE: 49,
  TWO: 50,
  THREE: 51,
  FOUR: 52,
  FIVE: 53,
  ESC: 27,
  a: 65,
  b: 66,
  n: 78,
  c: 67,
  w: 87,
  s: 83,
  d: 68,
  z: 90,
  x: 88,
  f: 70,
  p: 80,
  r: 82,
  m: 77,
  h: 72,
  v: 86,

  isDown(keyCode) {
      return this.pressed[keyCode];
  },

  justReleased(keyCode) {
      return this.released[keyCode];
  },

  onKeydown(event) {
      this.pressed[event.keyCode] = true;
  },

  onKeyup(event) {
      this.released[event.keyCode] = true;
      delete this.pressed[event.keyCode];

  },

  update() {
    // reset the released keys without creating new objects
    for (let key in this.released) {
      delete this.released[key];
    
    }
  }
};

export function resizeCanvas(canvas, baseWidth, baseHeight) {
  const aspectRatio = baseWidth / baseHeight;
  let newWidth = Math.floor(window.innerWidth / baseWidth) * baseWidth;
  let newHeight = newWidth / aspectRatio;

  if (newHeight > window.innerHeight) {
      newHeight = Math.floor(window.innerHeight / baseHeight) * baseHeight;
      //newHeight = window.innerHeight;
      newWidth = newHeight * aspectRatio;
  }

  canvas.style.width = `${newWidth}px`;
  canvas.style.height = `${newHeight}px`;
}

export function loadAtlas(atlasURL, callback) {
  const atlasImage = new Image();
  atlasImage.src = atlasURL;

  atlasImage.onload = function () {
      let c = document.createElement('canvas');
      c.width = 64;
      c.height = 32;
      let ctx = c.getContext('2d');
      ctx.drawImage(atlasImage, 0, 0);
      const atlas = new Uint32Array(ctx.getImageData(0, 0, 64, 32).data.buffer);
      callback(atlas);
  };
}
export class PerlinNoise {
  constructor() {
    this.gradients = {};
    this.memory = {};
  }

  randVect() {
    const theta = Math.random() * 2 * Math.PI;
    return { x: Math.cos(theta), y: Math.sin(theta) };
  }

  dotProdGrid(x, y, vx, vy) {
    const dVect = { x: x - vx, y: y - vy };
    let gVect;
    if (this.gradients[[vx, vy]]) {
      gVect = this.gradients[[vx, vy]];
    } else {
      gVect = this.randVect();
      this.gradients[[vx, vy]] = gVect;
    }
    return dVect.x * gVect.x + dVect.y * gVect.y;
  }

  smootherStep(x) {
    return 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
  }

  interp(x, a, b) {
    return a + this.smootherStep(x) * (b - a);
  }

  seed() {
    this.gradients = {};
    this.memory = {};
  }

  get(x, y) {
    if (this.memory.hasOwnProperty([x, y])) return this.memory[[x, y]];

    const xf = Math.floor(x);
    const yf = Math.floor(y);

    const tl = this.dotProdGrid(x, y, xf, yf);
    const tr = this.dotProdGrid(x, y, xf + 1, yf);
    const bl = this.dotProdGrid(x, y, xf, yf + 1);
    const br = this.dotProdGrid(x, y, xf + 1, yf + 1);
    const xt = this.interp(x - xf, tl, tr);
    const xb = this.interp(x - xf, bl, br);
    const v = this.interp(y - yf, xt, xb);

    this.memory[[x, y]] = v;
    return v;
  }
}
export class rectangle {
  constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
  }

  intersects(other) {
      return this.x < other.x + other.width &&
             this.x + this.width > other.x &&
             this.y < other.y + other.height &&
             this.y + this.height > other.y;
  }

  contains(x, y) {
      return x >= this.x && x <= this.x + this.width &&
             y >= this.y && y <= this.y + this.height;
  }
}




