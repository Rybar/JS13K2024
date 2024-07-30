import RetroBuffer from './core/RetroBuffer.js';
import MusicPlayer from './core/musicplayer.js';

//sound assets
import tada from './sounds/tada.js';

import { playSound, Key, choice, inView, lerp, callOnce, rand, resizeCanvas, loadAtlas } from './core/utils.js';
import Splode from './gfx/Splode.js';
import AnimRect from './gfx/AnimRect.js';
import AnimLine from './gfx/AnimLine.js';
(function(){

// document.body.style="margin:0; background-color:black; overflow:hidden";
//same resolution as picotron, 16x9 aspect ratio
w = 480, h = 270;

//palette is a 1x64 image containing the AAP64 palette. It can be larger for sprite use but the top row is read in as the palette.
//build step catches DATAURL and inlines the image as base64. 
const atlasURL = 'DATAURL:src/img/palette.webp';
atlasImage = new Image();
atlasImage.src = atlasURL;

loadAtlas(atlasURL, (atlas) => {
  const r = new RetroBuffer(w, h, atlas, 3);
  window.r = r;
  document.getElementById('game').appendChild(r.c);
  document.getElementById('game').style.background = "none";
  gameInit();
  resizeCanvas(r.c, w, h);
});

function gameInit(){
  window.playSound = playSound;
  gamebox = document.getElementById("game");
  gamebox.appendChild(r.c);
  // r.replaceDitherTable();
  createEventListeners();
  
  gameloop();
}

window.t = 1;

sounds = {};
soundsReady = 0;
totalSounds = 8;
audioTxt = "";
debugText = "";
gamestate = 0;
started = false;
entitiesArray = [];
view = {x:0, y:0};


function initGameData(){
  //initialize game data
  entitiesArray = [];
}

function initAudio(){
  audioCtx = new AudioContext;
  audioMaster = audioCtx.createGain();
  compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-60, audioCtx.currentTime);
    compressor.knee.setValueAtTime(40, audioCtx.currentTime); 
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

  audioMaster.connect(compressor);
  compressor.connect(audioCtx.destination);

  sndData = [
    {name:'tada', data: tada},
  ]
  totalSounds = sndData.length;
  soundsReady = 0;
  sndData.forEach(function(o){
    var sndGenerator = new MusicPlayer();
    sndGenerator.init(o.data);
    var done = false;
    setInterval(function () {
      if (done) {
        return;
      }
      done = sndGenerator.generate() == 1;
      soundsReady+=done;
      if(done){
        let wave = sndGenerator.createWave().buffer;
        audioCtx.decodeAudioData(wave, function(buffer) {
          sounds[o.name] = buffer;
        })
      }
    },0)
  })
}

function updateGame(){
  t+=1;
}

function drawGame(){
  r.clear(64, r.SCREEN);
  let txt = "GAME SCREEN";
  r.text(txt, w/2-2, 100, 1, 3, 'center', 'top', 1, 22);
  r.render();
}

function titlescreen(){
  r.clear(64, r.SCREEN);
  
  //draw a box 4x4 of each color 0 thru 63 across the bottom of the screen
  for(let i = 0; i < 64; i++){
    r.fillRect(i*7, 250, 7, 8, i);
  } 
  r.renderSource = r.SCREEN;
  drawEntities(entitiesArray);
  let txt = "TITLE SCREEN";
  r.text(txt, w/2-2, 100, 1, 1, 'center', 'top', 1, 22);
  r.render();
}

function resetGame(){
  //reset arrays to emmpty, etc
  //then re-init
  initGameData();
  gameState = 2;
}

function preload(){
  r.clear(64, r.SCREEN);
  r.renderTarget = r.SCREEN;
  drawDemoThings();
  r.text(audioTxt, w/2-2, 100, 1, 1, 'center', 'top', 1, 22);
  if(Key.justReleased(Key.UP) || Key.justReleased(Key.w) || Key.justReleased(Key.z)){
    if(soundsReady == 0 && !started){
    initGameData();
    initAudio();
    started = true;
    }else {
      callOnce(tadaSplode());
      gamestate = 2;
    }
  }; 
  audioTxt = "CLICK TO ALLOW AUDIOCONTEXT TO CONTINUE\n";
  if(soundsReady == totalSounds){
    audioTxt="ALL SOUNDS RENDERED.\nPRESS UP/W/Z TO CONTINUE";
  } else if (started){
    audioTxt = "SOUNDS RENDERING... " + soundsReady;
  } else {
    audioTxt = "CLICK TO ALLOW AUDIOCONTEXT TO CONTINUE";
  }
  r.render();
}

createEventListeners = function(){
  window.addEventListener('keyup', function (event) {
    Key.onKeyup(event);
  }, false);
  window.addEventListener('keydown', function (event) {
    Key.onKeydown(event);
  }, false);
  window.addEventListener('blur', function (event) {
    paused = true;
  }, false);
  window.addEventListener('focus', function (event) {
    paused = false;
  }, false);
  window.addEventListener('resize', function (event) {
    resizeCanvas(r.c, w, h);
  }, false);
}

onclick=e=>{
  x=e.pageX;y=e.pageY;
  paused = false;
  switch(gamestate){
      case 0: // react to clicks on screen 0s
        if(soundsReady == 0 && !started){
          initGameData();
          initAudio();
          started = true;
        }
      break;
      case 1: // react to clicks on screen 1
      case 2: // react to clicks on screen 2
      case 3: // react to clicks on screen 3
  }
}

function pruneDead(entitiesArray){
  for(let i = 0; i < entitiesArray.length; i++){
    let e = entitiesArray[i];
    if(!e.alive){
      entitiesArray.splice(i,1);
    }
  }
}

function pruneScreen(entitiesArray){
  for(let i = 0; i < entitiesArray.length; i++){
    let e = entitiesArray[i];
    if(!inView(e)){
      entitiesArray.splice(i,1);
    }
  }
}

function drawEntities(entitiesArray){
  for(let i = 0; i < entitiesArray.length; i++){
    let e = entitiesArray[i];
    e.update();
    e.draw(r, view);
  }
}


function gameloop(){
  if(1==1){
  //stats.begin();
    switch(gamestate){
      case 0: 
        preload();
        updateGame();
        break;
      case 1: //game
        updateGame();
        drawGame(r);
        break;
      case 2: 
        updateGame();
        titlescreen();
        break;
    }
    //pruneDead(entitiesArray);
    //pruneScreen(entitiesArray);
    Key.update();
   // stats.end();
    requestAnimationFrame(gameloop);
  }
}

function tadaSplode(){
  //make some splodes at random positions
  for (let i = 0; i < 10; i++){
    entitiesArray.push(
      new Splode(r, rand(0,w), rand(0,h), 200, rand(1, 63))
    )
  }
  //push a bunch of random AnimRects
  for (let i = 0; i < 10; i++){
    entitiesArray.push (
      new AnimRect(r, rand(0,w), rand(0,h), rand(10, 100), rand(10, 100), choice[0,1,2,3], choice(["clockwise", "counterClockwise"]), rand(1, 5), rand(1, 63))
    )
  }
  entitiesArray.push (
    new AnimRect(r, 10, 10, 100, 100, 1, "clockwise", 2, 22)
  )
  entitiesArray.push (
    new AnimLine(r, 10, 10, 110, 110, 22, 2)
  )
  playSound(sounds.tada, 1, 0, 1, false);
}

function drawDemoThings(){
  //draw a box 4x4 of each color 0 thru 63 across the bottom of the screen
  for(let i = 0; i < 64; i++){
    r.fillRect(i*7, 250, 7, 8, i);
  }

  //use each drawing function to prevent treeshake, test size
  r.fillRect(10,10,10,10,22);
  r.fillCircle(30,15, 5, 22);
  r.line(40,10,50,20, 22);
  r.fillTriangle({x:60, y:10}, {x:70, y:20}, {x:60, y:20}, 22);
  r.text("ABCDEFGABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_!@#.'\"?/<()", 80, 10, 1, 1, 'left', 'top', 1, 22);
  
  let angle = t % 360;
  r.gradRect(10, 40, 50, 50, 3, 5, angle);
  r.gradRect(70, 40, 50, 50, 3, 5, (angle + 45)%360);
  r.gradRect(140, 40, 50, 50, 3, 5, (angle + 90)%360);

  r.sspr(0,0, 64,72, 200, 30, 64, 72, false, false);
  r.fillRect(200,200, 8,8, 7);

  //fill a field with random tiles and colors
  r.LCG.state = 0xdeadbeef;
  r.dither[8]
  for(let i = 0; i < 20; i++){
    for(let j = 0; j < 20; j++){
      r.drawTile(r.LCG.randomInt(0, 63), i*8, j*8, 0, r.LCG.randomInt(0,63));
    }
  }
  r.pat = r.dither[0];

  r.drawTile(1, 208, 200, 4, 9);
  r.drawTile(2, 216, 200, 25, 14);

  r.pat = r.dither[8];
  r.fillCircle(50, 150, 20, 20, 64);
  r.pat = r.dither[0];

}

})();
