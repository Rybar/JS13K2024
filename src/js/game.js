import RetroBuffer from './core/RetroBuffer.js';
import MusicPlayer from './core/musicplayer.js';
import { playSound, Key, inView, callOnce, rand, resizeCanvas, loadAtlas, choice } from './core/utils.js';
import Splode from './gfx/Splode.js';

//sound assets
import tada from './sounds/tada.js';
import missileWhoosh from './sounds/missileWhoosh.js';
import boom1 from './sounds/boom1.js';
import spawn from './sounds/spawn.js';

//tile assets
import background1 from '../assets/background1.js';

(function () {
    document.body.style = "margin:0; background-color:black; overflow:hidden";
    const w = 480, h = 270;
    window.w = w; window.h = h;
    const atlasURL = 'DATAURL:src/img/palette.webp';
    const atlasImage = new Image();
    atlasImage.src = atlasURL;

    loadAtlas(atlasURL, (atlas) => {
        const r = new RetroBuffer(w, h, atlas, 3);
        window.r = r;
        document.getElementById('game').appendChild(r.c);
        document.getElementById('game').style.background = "none";
        gameInit();
        resizeCanvas(r.c, w, h);
    });

    function gameInit() {
        window.playSound = playSound;
        gamebox = document.getElementById("game");
        gamebox.appendChild(r.c);
        createEventListeners();
        gameloop(0);
    }

    window.t = 0;
    sounds = {};
    soundsReady = 0;
    totalSounds = 8;
    audioTxt = "";
    debugText = "";
    gamestate = 0;
    started = false;
    entitiesArray = [];
    lastFrameTime = 0;
    view = { x: 0, y: 0, w: w, h: h };


    function initGameData() {
        //initialize game data
        entitiesArray = [];
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
            { name: 'missileWhoosh', data: missileWhoosh },
            { name: 'boom1', data: boom1 },
            { name: 'spawn', data: spawn },
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
        t += deltaTime;
        entitiesArray.forEach(entity => entity.update());
    }

    function drawGame() {
        r.clear(13, r.SCREEN);

        // Draw background
        r.pat = 0b1111111111111111;
        r.drawTileAsset(0, 50, background1);

        drawEntities(entitiesArray);

        r.text("GAME", w / 2, 10, 1, 1, 'center', 'top', 1, 22);
        
        r.render();
    }

    function titlescreen() {
        r.clear(64, r.SCREEN);
        r.drawTileAsset(0, 0, background1);
        drawEntities(entitiesArray);
        let txt = "SIX AND SEVEN";
        r.text(txt, w / 2, 100, 4, 1, 'center', 'top', 4, 22);
        txt = "CLICK TO START";
        r.text(txt, w / 2, 125, 1, 1, 'center', 'top', 1, 22);
        //countdownLoop();
        r.render();
    }

    function resetGame() {
        //reset arrays to emmpty, etc
        initGameData();
        gameState = 2;
    }

    function preload() {

        r.clear(64, r.SCREEN);
        r.renderTarget = r.SCREEN;
        r.pat = 0b1111111111111111;

        let txt = "SIX AND SEVEN";
        r.text(txt, w / 2, 100, 4, 1, 'center', 'top', 4, 2);

        r.text(audioTxt, w / 2 - 2, 130, 1, 1, 'center', 'top', 1, 22);
        if (Key.justReleased(Key.UP) || Key.justReleased(Key.w) || Key.justReleased(Key.z)) {
            if (soundsReady == 0 && !started) {
                initGameData();
                initAudio();
                started = true;
            } else {
                callOnce(tadaSplode());
                gamestate = 2;
            }
        };

        audioTxt = "CLICK TO ALLOW AUDIOCONTEXT TO CONTINUE\n";
        if (soundsReady == totalSounds) {
            audioTxt = "ALL SOUNDS RENDERED.\nPRESS UP/W/Z TO CONTINUE";
        } else if (started) {
            audioTxt = "SOUNDS RENDERING... " + soundsReady;
        } else {
            audioTxt = "CLICK TO ALLOW AUDIOCONTEXT TO CONTINUE";
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
        const rect = r.c.getBoundingClientRect(); // Get the canvas position and size
        const scaleX = r.c.width / rect.width;    // Calculate the horizontal scale
        const scaleY = r.c.height / rect.height;  // Calculate the vertical scale
        
        // Calculate the mouse coordinates relative to the canvas
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
    
        paused = false;
        switch (gamestate) {
            case 0: // react to clicks on screen 0s
                if (soundsReady == 0 && !started) {
                    initGameData();
                    initAudio();
                    started = true;
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
            e.update();
            e.draw(r, view);
        }
    }

    function gameloop(timestamp) {
        const deltaTime = timestamp - lastFrameTime;
        lastFrameTime = timestamp;

        if (1 == 1) {
            //stats.begin();
            switch (gamestate) {
                case 0:
                    preload();
                    //updateGame(deltaTime);
                    break;
                case 1: //game
                    updateGame(deltaTime);
                    drawGame();
                    break;
                case 2:
                    //updateGame(deltaTime);
                    titlescreen();
                    break;
            }
            pruneDead(entitiesArray);
            pruneScreen(entitiesArray);
            Key.update();
            // stats.end();
            requestAnimationFrame(gameloop);
        }
    }

    function tadaSplode() {
        //make some splodes at random positions
        for (let i = 0; i < 10; i++) {
            entitiesArray.push(
                new Splode(rand(0, w), rand(0, h), 200, rand(1, 63))
            )
        }

        playSound(sounds.tada, 1, 0, 1, false);
    }

})();
