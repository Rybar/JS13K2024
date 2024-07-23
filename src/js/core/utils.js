export function rand(min, max) {
  return Math.floor(Math.random() * (max + 1 - min) + min);
};

export function choice(values) {
  return values[rand(0, values.length - 1)];
};

export function lerp(a, b, x){
   return a + (b -a ) * x;
}

export function inView(o, padding=0){
  return o.x - view.x + padding > 0 &&
         o.y - view.y + padding > 0 &&
         o.x - view.x - padding < w &&
         o.y - view.y - padding < h
}

export function callOnce(fn){
  let called = false;
  return function(){
    if(called) return;
    called = true;
    fn();
  }
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
  panNode.pan.value = pan;
  source.start();
  return {volume: gainNode, sound: source};

}

export const Key = {

  _pressed: {},
  _released: {},

  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SPACE: 32,
  ONE: 49,
  TWO: 50,
  THREE: 51,
  FOUR: 52,
  a: 65,
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

  isDown(keyCode) {
      return this._pressed[keyCode];
  },

  justReleased(keyCode) {
      return this._released[keyCode];
  },

  onKeydown(event) {
      this._pressed[event.keyCode] = true;
  },

  onKeyup(event) {
      this._released[event.keyCode] = true;
      delete this._pressed[event.keyCode];

  },

  update() {
      this._released = {};
  }
};

export function resizeCanvas(canvas, baseWidth, baseHeight) {
  const aspectRatio = baseWidth / baseHeight;
  let newWidth = Math.floor(window.innerWidth / baseWidth) * baseWidth;
  let newHeight = newWidth / aspectRatio;

  if (newHeight > window.innerHeight) {
      newHeight = Math.floor(window.innerHeight / baseHeight) * baseHeight;
      newWidth = newHeight * aspectRatio;
  }

  canvas.style.width = `${newWidth}px`;
  canvas.style.height = `${newHeight}px`;

  // Optionally, adjust the canvas rendering size if using a higher resolution
  //canvas.width = newWidth;
  //canvas.height = newHeight;
}

export function loadAtlas(atlasURL, callback) {
  const atlasImage = new Image();
  atlasImage.src = atlasURL;

  atlasImage.onload = function () {
      let c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      let ctx = c.getContext('2d');
      ctx.drawImage(atlasImage, 0, 0);
      const atlas = new Uint32Array(ctx.getImageData(0, 0, 64, 64).data.buffer);
      callback(atlas);
  };
}



