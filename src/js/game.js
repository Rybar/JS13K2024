import RetroBuffer from './core/RetroBuffer.js';
import MusicPlayer from './core/musicplayer.js';
import { playSound, Key, inView, rand, resizeCanvas, loadAtlas, lerp, callOnce } from './core/utils.js';

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

//gfx assets
//import background1 from '../assets/background1.js';
// import platformerTest from '../assets/platformerTest.js';
// import tileAssetTest from '../assets/tileAssetTest.js';
//entities

import Player from './entities/player.js';
import Floor from './entities/floor.js';
import Map from './entities/map.js';
import Gremlin from './entities/gremlin.js';

(function () {
    document.body.style = "margin:0; background-color:black; overflow:hidden";
    const w = 480, h = 270;
    window.w = w; window.h = h;
    const atlasURL = 'DATAURL:src/img/palette.webp';
    const atlasImage = new Image();
    atlasImage.src = atlasURL;

    loadAtlas(atlasURL, (atlas) => {
        const r = new RetroBuffer(w, h, atlas, 10);
        window.r = r;
        window.LIGHTS = r.PAGE_7;
        document.getElementById('game').appendChild(r.c);
        document.getElementById('game').style.background = "none";
        gameInit();
        resizeCanvas(r.c, w, h);
    });

    function gameInit() {
        gamebox = document.getElementById("game");
        gamebox.appendChild(r.c);
        createEventListeners();
        gameloop(0);
    }

    window.t = 0;
    text = "";
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
    window._entitiesArray = [];
    window.gremlinsArray = [];
    window.portalLocation = { x: 0, y: 0 };
    window.gameInitialized = false;
    window.generatingNewFloor = false;
    window.currentFloor = 0;
    window.nextLevel = nextLevel;
    startGameMusic = callOnce(() => {
        playSound(sounds.gamemusic, 1, 0, 0.5, true);
    });
    floors = [];
    rooms = [];
    map = null;
    fps = 0;
    lastFrameTime = 0;
    frameCount = 0;
    paused = false;
    tileSize = 8;
    view = {
        x: 0, y: 0,
        target: {x: 0, y: 0},
         w: w, h: h
        };


    function initGameData() {
        //initialize game data
        _entitiesArray = [];
        gremlinsArray = [];
        floors.push(new Floor(480, 270, 40,25));
        rooms = floors[0].rooms;
        window.rooms = rooms;
        //pick random room
        let room = rooms[Math.floor(Math.random() * rooms.length)];
        let startX = room.x + room.width / 2;
        let startY = room.y + room.height / 2;
        P = new Player(startX * tileSize, startY * tileSize);
        gremlin = new Gremlin((startX + 2) * tileSize, (startY + 2) * tileSize);
        gremlinsArray.push(gremlin);        
        window.map = new Map(480, 270, tileSize, r.PAGE_3);
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
            { name: 'gamemusic', data: gamemusic }
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
        if(paused) { return; }
        t += deltaTime;
        rooms.forEach(room => {room.update(P);});
        _entitiesArray.forEach(entity => entity.update());
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

        drawEntities(_entitiesArray);
        drawEntities(gremlinsArray);
        P.draw(r, view);


        if(generatingNewFloor) {
            r.fRect(0, 0, w, h, 3);
            text = "LOADING THE NEXT FLOOR";
            r.text(text, w / 2, h / 2, 1, 1, 'center', 'middle', 1, 22);
        }
;
        drawLightsOverlay();

        if (paused) { drawPaused(); }

        drawUI();


        r.render();
    }

    function drawLightLayerBase() {
        r.renderTarget = LIGHTS;
        r.clear(0, LIGHTS);
        r.fRect(0, 0, 480, 270, 4, 5, 8);
        r.renderTarget = r.SCREEN;
    }

    function drawLightsOverlay() {
       
        //remap palette to shade colors
        r.pal=[65,66,67,68,69,70];

        //render lights layer over screen layer
        r.renderSource = LIGHTS;
        r.renderTarget = r.SCREEN;
        r.spr(0, 0, 480, 270, 0, 0);

        //reset palette
        r.pal = r.palDefault.slice();
        r.renderSource = r.PAGE_1;
    }

    function drawUI() {
        // Draw debug text
        debugText= `FPS: ${fps.toFixed(2)}`;
        r.text(debugText, 10, 10, 1, 1, 'left', 'top', 1, 22);

        debugText = `${P.health.toFixed(2)}\nGB: ${P.gremlinBlood}\nAP: ${P.completeAltarTorchCount}`
        r.text(debugText, P.x - view.x, P.y - view.y - 28, 1, 1, 'center', 'top', 1, 22);
    
        debugText = `FLOOR: ${currentFloor}`;
        r.text(debugText, w - 10, 10, 1, 1, 'right', 'top', 2, 22);
        debugText = `TORCHES: ${P.completeAltarTorchCount}`;
        r.text(debugText, w - 10, 30, 1, 1, 'right', 'top', 2, 22);

    }

    function titlescreen() {
        r.clear(64, r.SCREEN);
        r.drawTileAsset(0, 0, background1);
        r.drawTileAsset(0, 0, platformerTest);
        r.drawTileAsset(0, 0, tileAssetTest);
        drawEntities(_entitiesArray);
        text = "SIX AND SEVEN";
        r.text(text, w / 2, 100, 4, 1, 'center', 'top', 4, 22);
        text = "CLICK TO START";
        r.text(text, w / 2, 125, 1, 1, 'center', 'top', 1, 22);
        r.render();
        playSound(sounds.spawn);
    }

    function resetGame() {
        //reset arrays to emmpty, etc
        initGameData();
        gameState = 2;
    }

    function newFloor() {
        //create new floor
        //I don't think we will need to store floors, so just overwrite the first one
        currentFloor++;
        floors = [];
        _entitiesArray = [];
        floors.push(new Floor(480, 270, 40, 25));
        rooms = floors[floors.length - 1].rooms;
        //pick random room
        let room = rooms[Math.floor(Math.random() * rooms.length)];
        let startX = room.x + room.width / 2;
        let startY = room.y + room.height / 2;
        P.x = startX * tileSize;
        P.y = startY * tileSize;
    }

    function preload() {

        r.clear(64, r.SCREEN);
        r.renderTarget = r.SCREEN;
        
        text = "SIX AND SEVEN";
        r.text(text, w / 2, 100, 4, 1, 'center', 'top', 4, 2);
        r.text(audioTxt, w / 2 - 2, 130, 1, 1, 'center', 'top', 1, 22);
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
            gamestate = GAMESCREEN;
        }
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
            resizeCanvas(r.c, w, h);
        }, false);
    }

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
            case 1: // react to clicks on screen 1
                break;
            case 2:
                gamestate = 1;
                break;
            case 3: // react to clicks on screen 3
        }
    }
    

    function pruneDead(_entitiesArray) {
        for (let i = 0; i < _entitiesArray.length; i++) {
            let e = _entitiesArray[i];
            if (!e.alive) {
                _entitiesArray.splice(i, 1);
            }
        }
    }

    function pruneScreen(_entitiesArray) {
        for (let i = 0; i < _entitiesArray.length; i++) {
            let e = _entitiesArray[i];
            if (!inView(e)) {
                _entitiesArray.splice(i, 1);
            }
        }
    }

    function drawEntities(_entitiesArray) {
        for (let i = 0; i < _entitiesArray.length; i++) {
            let e = _entitiesArray[i];
            if(inView(e, 8)){e.draw(r, view);}
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
            pruneDead(_entitiesArray);
            requestAnimationFrame(gameloop);
        }
    }
    
    function cameraFollow() {
        //implement deadzone
        deadzone = { x: 200, y: 100 };
        if(P.x - view.x > w - deadzone.x) {
            view.target.x = P.x - w + deadzone.x;
        }
        if(P.x - view.x < deadzone.x) {
            view.target.x = P.x - deadzone.x;
        }
        if(P.y - view.y > h - deadzone.y) {
            view.target.y = P.y - h + deadzone.y;
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
            nextLevel();
        }
        P.handleInput(Key);    
    }

    function drawPaused() {
        r.fRect(0, 0, w, h, 66, 67, 8);
        text = "PAUSED";
        r.text(text, w / 2, h / 2, 1, 1, 'center', 'middle', 1, 22);
        drawMiniMap();
    }

    function drawMiniMap() {
        r.renderSource = r.PAGE_3;
        r.renderTarget = r.SCREEN;
        r.fRect(0, 0, 480,270,0);
        r.spr(0,0,480,270,0,0);
        //draw P position
        r.fRect(P.x/8-1, P.y/8-1, 2, 2, 22);
        //draw portal position
        r.fRect(portalLocation.x-1, portalLocation.y-1, 3, 3, 7);
        
    }

    function spawnGremlin() {
        //find a walkable tile near P to spawn gremlin
        let x = P.x + rand(-90, 90);
        let y = P.y + rand(-90, 90);
        let tries = 0;
        while(map.getTileAtPixel(x, y) == 0 && tries < 100) {
            x = P.x + rand(-90, 90);
            y = P.y + rand(-90, 90);
            tries++;
        }
        if(tries < 100) {
            gremlinsArray.push(new Gremlin(x, y));
            playSound(sounds.spawn);
        }
        
    }

    function nextLevel() {
        P.completeAltarTorchCount = 0;
        generatingNewFloor = true;
            setTimeout(() => {
                newFloor();
                generatingNewFloor = false;
            }, 500);
    }


})();
