import RetroBuffer from './core/RetroBuffer.js';
import MusicPlayer from './core/musicplayer.js';
import { playSound, Key, inView, rand, resizeCanvas, loadAtlas, lerp, callOnce, radians, choice } from './core/utils.js';

//sound assets
import potBreak from './sounds/potBreak.js';
import torch from './sounds/torch.js';
import spawn from './sounds/spawn.js';
import tada from './sounds/tada.js';
import footstep from './sounds/footstep.js';
import gremlinHurt from './sounds/gremlinHurt.js';
import playerHurt from './sounds/playerHurt.js';
import pickup from './sounds/pickup.js';
import gamemusic from './sounds/gamemusic.js';
import playerDeath from './sounds/playerDeath.js';
import playerAttack from './sounds/playerAttack.js';
import altarDone from './sounds/altarDone.js';

//gfx assets
//import background1 from '../assets/background1.js';
// import platformerTest from '../assets/platformerTest.js';
// import tileAssetTest from '../assets/tileAssetTest.js';
//entities

import Player from './entities/player.js';
import Floor from './entities/floor.js';
import Map from './entities/map.js';
import Gremlin from './entities/gremlin.js';
import Room from './entities/room.js';
import Particle from './entities/particle.js';

(function () {
    document.body.style = "margin:0; background-color:black; overflow:hidden";
    const screenWidth = 480, screenHeight = 270;
    window.screenWidth = screenWidth; window.screenHeight = screenHeight;
    const atlasURL = 'DATAURL:src/img/palette.webp';
    const atlasImage = new Image();
    atlasImage.src = atlasURL;

    loadAtlas(atlasURL, (atlas) => {
        const r = new RetroBuffer(screenWidth, screenHeight, atlas, 10);
        window.r = r;
        window.LIGHTS = r["PAGE7"];
        document.getElementById('game').appendChild(r.c);
        document.getElementById('game').style.background = "none";
        gameInit();
        resizeCanvas(r.c, screenWidth, screenHeight);
    });

    function gameInit() {
        gamebox = document.getElementById("game");
        gamebox.appendChild(r.c);
        createEventListeners();
        gameloop(0);
    }

    window.t = 0;
    audioMaster = null;
    text = "";
    gamepads = [];
    window.P = null;
    sounds = {};
    soundsReady = 0;
    totalSounds = 4;
    audioTxt = "";
    debugText = "";
    TITLESCREEN = 2;
    GAMESCREEN = 1;
    gamestate = 0;
    started = false;
    entitiesArray = [];
    gremlinsArray = [];
    portalLocation = { x: 0, y: 0 };
    gameInitialized = false;
    generatingNewFloor = false;
    floorCompleteTime = 0;
    currentFloor = 1;
    window.nextLevel = nextLevel;
    startGameMusic = callOnce(() => {
        playSound(sounds.gamemusic, 1, 0, 0.5, true);
    });
    floors = [];
    thirteenthFloor = null;
    rooms = [];
    map = null;
    fps = 0;
    lastFrameTime = 0;
    frameCount = 0;
    paused = false;
    gameOver = false;
    tileSize = 16;
    view = {
        x: 0, y: 0,
        target: {x: 0, y: 0},
         w: screenWidth, h: screenHeight
        };


    function initGameData() {
        //initialize game data
        entitiesArray = [];
        gremlinsArray = [];
        floors = [];
        floors.push(new Floor(480, 270, 35,20, 120));
        //floors.push(new Floor(480, 270, 40,25, 10));
        thirteenthFloor = buildThirteenthFloor();
        rooms = floors[0].rooms;
        window.rooms = rooms;
        //pick random room
        let room = rooms[Math.floor(Math.random() * rooms.length)];
        let startX = room.x + room.width / 2;
        let startY = room.y + room.height / 2;
        P = new Player(startX * tileSize, startY * tileSize);       
        map = new Map(480, 270, tileSize, r.PAGE3);
        gameInitialized = true;

    }

    function initAudio() {
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
            { name: 'tada', data: tada },
            { name: 'potBreak', data: potBreak },
            { name: 'torch', data: torch },
            { name: 'spawn', data: spawn },
            { name: 'footstep', data: footstep },
            { name: 'gremlinHurt', data: gremlinHurt },
            { name: 'playerHurt', data: playerHurt },
            { name: 'pickup', data: pickup },
            { name: 'gamemusic', data: gamemusic },
            { name: 'playerDeath', data: playerDeath },
            { name: 'playerAttack', data: playerAttack },
            { name: 'altarDone', data: altarDone }
        ]
        totalSounds = sndData.length;
        soundsReady = 0;
        sndData.forEach(function (o) {
            var sndGenerator = new MusicPlayer();
            sndGenerator.init(o.data);
            var done = false;
            setInterval(function () {
                if (done) {
                    return;
                }
                done = sndGenerator.generate() == 1;
                soundsReady += done;
                if (done) {
                    let wave = sndGenerator.createWave().buffer;
                    audioCtx.decodeAudioData(wave, function (buffer) {
                        sounds[o.name] = buffer;
                    })
                }
            }, 0)
        })
    }

    function updateGame(deltaTime) {
        handleInput();
        if(paused) { 
            audioMaster.gain.value = 0.03;
            return; } else {
                audioMaster.gain.value = 1;
            }
        if(gameOver) { return; }
        t += deltaTime;
        rooms.forEach(room => {room.update(P);});
        entitiesArray.forEach(entity => entity.update());
        gremlinsArray.forEach(gremlin => gremlin.update());
        P.update();

        //spawn another gremlin near P every 5 seconds
        if(t % 5000 < deltaTime) {
            spawnGremlin();
        }
       
        map.update();
        
        cameraFollow();
    }

    function drawGame() {
        r.clear(1, r.SCREEN);

        drawLightLayerBase();


        // Draw background
        r.pat = 0b1111111111111111;

        //draw things
        map.draw(r, view);
        rooms.forEach(room => {
            room.drawAltar(r, view);
        });

        drawEntities(entitiesArray);
        drawEntities(gremlinsArray);
        P.draw(r, view);


        if(generatingNewFloor) {
            floorStats(floorCompleteTime);
        }
;
        drawLightsOverlay();

        if (paused) { drawPaused(); }
        if (gameOver) { drawGameOver(); }

        drawUI();

        r.render();
    }

    function drawLightLayerBase() {
        r.renderTarget = r["PAGE7"];
        r.clear(0, r["PAGE7"]);
        r.fRect(0, 0, 480, 270, 4, 5, 8);
        r.renderTarget = r["SCREEN"];
    }

    function drawColorBarAndAtlas() {
        for(let i = 0; i < 64; i++) {
            r.fRect(i * 8, 0, 8, 8, i);
        }
        r.renderSource = r["PAGE1"]
        r.sspr(0, 0, 480, 270, 60, 60, 480, 270);

    }

    function drawLightsOverlay() {
       
        //remap palette to shade colors
        r.pal=[65,66,67,68,69,70];

        //render lights layer over screen layer
        r.renderSource = r["PAGE7"];
        r.renderTarget = r["SCREEN"];
        r.spr(0, 0, 480, 270, 0, 0);

        //reset palette
        r.pal = r.palDefault.slice();
        r.renderSource = r["PAGE1"];
    }

    function drawUI() {
        // Draw debug text
        debugText= `FPS: ${fps.toFixed(2)}`;
        r.text(debugText, 10, 260, 1, 1, 'left', 'top', 1, 22);

        debugText = `${P.health.toFixed(2)}\nGB: ${P.gremlinBlood}\nAP: ${P.sumCompleted}`
        r.text(debugText, P.x - view.x, P.y - view.y - 28, 1, 1, 'center', 'top', 1, 22);
    
        debugText = `FLOOR: ${currentFloor}`;
        r.text(debugText, 10, 10, 1, 1, 'left', 'top', 2, 22);
        debugText = `${P.sumCompletedTorches()}`;
        r.text(debugText, screenWidth - 31, 25, 1, 1, 'center', 'top', 2, 22);

        P.completeAltars.forEach((altar, i) => {
            let spin = P.sumCompletedTorches() >= 13 ? t/900 : 0;
            let color = spin > 0 ? 22 : 4;
            if(spin > 0) {
                //emit green particle
                entitiesArray.push(new Particle(screenWidth - 31 + rand(-5, 5), 25,
                    rand(-.05, .05), rand(-.1, -.3), {color: [10,11,12,13,14,15], life: 30}));
            }
            r.polygon(450, 30, 15+altar*2, altar,
                altar%2==0 ? spin: -spin + radians(i*(360/13)), color, color);

            
        });
    
    }

    function titlescreen() {
        r.clear(64, r.SCREEN);
        // r.drawTileAsset(0, 0, background1);
        // r.drawTileAsset(0, 0, platformerTest);
        // r.drawTileAsset(0, 0, tileAssetTest);
        drawEntities(entitiesArray);
        text = "SIX AND SEVEN";
        r.text(text, screenWidth / 2, 100, 4, 1, 'center', 'top', 4, 22);
        text = "CLICK TO START";
        r.text(text, screenWidth / 2, 125, 1, 1, 'center', 'top', 1, 22);
        // if (Key.justReleased(Key.UP) || Key.justReleased(Key.w) || Key.justReleased(Key.z)) {
        //     //startGameMusic();
        //     gamestate = GAMESCREEN;
        // }
        gamepads = navigator.getGamepads();
        if(gamepads[0]) {
            text = "GAMEPAD CONNECTED";
            r.text(text, screenWidth / 2, 150, 1, 1, 'center', 'top', 1, 22);
        }

        r.render();

    }

    function resetGame() {
        //reset arrays to emmpty, etc
        gameOver = false;
        gameState = TITLESCREEN;
        initGameData();
    }

    function floorStats(completeTime) {
       
        r.fRect(0, 0, screenWidth, screenHeight, 3);
        text = "FLOOR COMPLETE IN " + Math.floor(completeTime/1000) + " SECONDS";
        r.text(text, screenWidth / 2, screenHeight / 2, 1, 1, 'center', 'middle', 1, 22);
        text = "LOADING THE NEXT FLOOR";
        r.text(text, screenWidth / 2, screenHeight / 2+16, 1, 1, 'center', 'middle', 1, 22);
            
    }

    function buildThirteenthFloor() {
        //start with deep copy of floor 1
        let floor = JSON.parse(JSON.stringify(floors[0]));
        //clear rooms and feature rooms
        floor.rooms = [];
        floor.featureRooms = [];
        //create 1 screen-sized room
        let x = screenWidth / 2 - 13;
        let y = screenHeight / 2 - 6;
        let room = new Room(x, y, 28, 14);
        floor.rooms.push(room);
        //boss?  giant portal?  puzzle?

        return floor;
    }

    function enterThirteenthFloor() {
        //replace current floor with thirteenth floor
        floors[0] = thirteenthFloor;
        let room = thirteenthFloor.rooms[0];
        rooms = thirteenthFloor.rooms;
        let startX = room.x + room.width / 2;
        let startY = room.y + room.height / 2;
        P.x = startX * tileSize;
        P.y = startY * tileSize;

    }

    function newFloor() {
        //create new floor
        //I don't think we will need to store floors, so just overwrite the first one
        currentFloor++;
        if(currentFloor == 13) {
            enterThirteenthFloor();
            return;
        }
        //floors = [];
        entitiesArray = [];
        floors[0] = (new Floor(480, 270, 40, 25, 10));
        rooms = floors[floors.length - 1].rooms;
        //pick random room
        let room = rooms[Math.floor(Math.random() * rooms.length)];
        let startX = room.x + room.width / 2;
        let startY = room.y + room.height / 2;
        P.x = startX * tileSize;
        P.y = startY * tileSize;
    }

    function preload() {

        r.clear(64, r["SCREEN"]);
        r.renderTarget = r["SCREEN"];
        
        // text = "SIX AND SEVEN";
        // r.text(text, screenWidth / 2, 100, 4, 1, 'center', 'top', 4, 2);
        r.text(audioTxt, screenWidth / 2 - 2, 130, 1, 1, 'center', 'top', 1, 22);
        if(started){
            audioTxt = "RETICULATING SPLINES";
        } else {
            audioTxt = "CLICK TO BEGIN GENERATION";
        }

        if (soundsReady == totalSounds && gameInitialized == true) {
            audioTxt = "ALL ASSETS CREATED.\nPRESS UP/W/Z TO CONTINUE";
        }
        if (Key.justReleased(Key.UP) || Key.justReleased(Key.w) || Key.justReleased(Key.z)) {
            startGameMusic();
            gamestate = TITLESCREEN;
        }

        //drawColorBarAndAtlas();
        r.render();
    }

    createEventListeners = function () {
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
            resizeCanvas(r.c, screenWidth, screenHeight);
        }, false);
    }

function gamepadHandler(event, connected) {
  const gamepad = event.gamepad;
  // Note:
  // gamepad === navigator.getGamepads()[gamepad.index]

  if (connected) {
    gamepads[gamepad.index] = gamepad;
  } else {
    delete gamepads[gamepad.index];
  }
}

window.addEventListener(
  "gamepadconnected",
  (e) => {
    gamepadHandler(e, true);
  },
  false,
);
window.addEventListener(
  "gamepaddisconnected",
  (e) => {
    gamepadHandler(e, false);
  },
  false,
);


    onclick = e => {
        const rect = r.c.getBoundingClientRect(); 
        const scaleX = r.c.width / rect.width;    
        const scaleY = r.c.height / rect.height;  // Calculate the vertical scale
        
        // Calculate the mouse coordinates relative to the canvas
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
    
        paused = false;
        switch (gamestate) {
            case 0: // react to clicks on screen 0s
                if (soundsReady == 0 && !started) {
                    started = true;
                    setTimeout(() => {
                        initAudio();
                        initGameData();
                    }, 100); //wait a bit to give preload text a chance to render
                }
                break;
            case GAMESCREEN: // react to clicks on screen 1
                break;
            case TITLESCREEN:
                gamestate = GAMESCREEN;
                break;
            case 3: // react to clicks on screen 3
        }
    }
    

    function pruneDead(entitiesArray) {
        for (let i = 0; i < entitiesArray.length; i++) {
            let e = entitiesArray[i];
            if (!e.alive) {
                entitiesArray.splice(i, 1);
            }
        }
    }

    function pruneScreen(entitiesArray) {
        for (let i = 0; i < entitiesArray.length; i++) {
            let e = entitiesArray[i];
            if (!inView(e)) {
                entitiesArray.splice(i, 1);
            }
        }
    }

    function drawEntities(entitiesArray) {
        for (let i = 0; i < entitiesArray.length; i++) {
            let e = entitiesArray[i];
            if(inView(e, tileSize)){e.draw(r, view);}
        }
    }

    function gameloop() {
        const timestamp = performance.now();
        const deltaTime = timestamp - lastFrameTime;
        const fpsInterval = 1000 / 60;
        frameCount++;
        if (timestamp - lastFrameTime >= fpsInterval) {
            fps = (frameCount * 1000) / (timestamp - lastFrameTime);
            lastFrameTime = timestamp;
            frameCount = 0;
            //console.log(`FPS: ${fps.toFixed(2)}`);
        }
    
        if (1 == 1) {
            switch (gamestate) {
                case 0:
                    preload();
                    break;
                case 1:
                    updateGame(deltaTime);
                    drawGame();
                    break;
                case 2:
                    titlescreen();
                    break;
            }
            Key.update();
            pruneDead(entitiesArray);
            requestAnimationFrame(gameloop);
        }
    }
    
    function cameraFollow() {
        //implement deadzone
        deadzone = { x: 200, y: 100 };
        if(P.x - view.x > screenWidth - deadzone.x) {
            view.target.x = P.x - screenWidth + deadzone.x;
        }
        if(P.x - view.x < deadzone.x) {
            view.target.x = P.x - deadzone.x;
        }
        if(P.y - view.y > screenHeight - deadzone.y) {
            view.target.y = P.y - screenHeight + deadzone.y;
        }
        if(P.y - view.y < deadzone.y) {
            view.target.y = P.y - deadzone.y;
        }

        //lerp camera to target
        view.x = lerp(view.x, view.target.x, 0.1);
        view.y = lerp(view.y, view.target.y, 0.1);

    }

   function handleInput() {
        if (Key.justReleased(Key.ESC) || Key.justReleased(Key.p)) {
            paused = !paused;
            console.log('paused', paused);
        }
        if (Key.justReleased(Key.r)) {
            resetGame();
        }
        gamepads = navigator.getGamepads();
        if(gamepads[0]) {
            P.handleGamepadInput(gamepads[0]);
        }else {
            P.handleInput(Key);
        }
    }

    function drawPaused() {
        r.fRect(0, 0, screenWidth, screenHeight, 66, 67, 8);
        text = "PAUSED";
        r.text(text, screenWidth / 2, 10, 1, 1, 'center', 'middle', 1, 22);
        drawMiniMap();
    }

    function drawGameOver() {
        r.fRect(0, 0, screenWidth, screenHeight, 66, 67, 8);
        text = "GAME OVER";
        r.text(text, screenWidth / 2, screenHeight / 2, 1, 1, 'center', 'middle', 3, 22);
        text = "PRESS R TO RESTART";
        r.text(text, screenWidth / 2, screenHeight / 2 + 20, 1, 1, 'center', 'middle', 1, 22);
        //drawMiniMap();
    }

    function drawMiniMap() {
        r.renderSource = r["PAGE3"];
        r.renderTarget = r["SCREEN"];
        r.fRect(0, 0, 480,270,0);
        r.spr(0,0,480,270,0,0);
        //draw P position
        r.fRect(P.x/tileSize-1, P.y/tileSize-1, 2, 2, 22);
        //draw portal position
        r.fRect(portalLocation.x-1, portalLocation.y-1, 3, 3, 7);
        
    }

    function spawnGremlin() {
        //if player current room is a feature room, spawn a gremlin in the corners
        let currentRoom = P.currentRoom;
        if(currentRoom.altar) {
            let roomCorners = {
                x1: currentRoom.x+1,
                y1: currentRoom.y+1,
                x2: currentRoom.x + currentRoom.width-2,
                y2: currentRoom.y + currentRoom.height-2
            }
            //pick random corner of room
            let x = choice([roomCorners.x1, roomCorners.x2]);
            let y = choice([roomCorners.y1, roomCorners.y2]);

            gremlinsArray.push(new Gremlin(x * tileSize, y * tileSize));
            playSound(sounds.spawn);
        }
    }

    function nextLevel() {
        P.completeAltars = [];
        generatingNewFloor = true;
            setTimeout(() => {
                newFloor();
                generatingNewFloor = false;
            }, 500);
    }


})();
