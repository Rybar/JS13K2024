import RetroBuffer from './core/RetroBuffer.js';
import MusicPlayer from './core/musicplayer.js';
import { playSound, Key, inView, callOnce, rand, resizeCanvas, loadAtlas } from './core/utils.js';
import Splode from './gfx/Splode.js';

//sound assets
import tada from './sounds/tada.js';

//tile assets
import platformerTest from '../assets/platformerTest.js';

class Enemy {
    constructor(x, y, size, speedX, speedY, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
        this.alive = true;
    }

    update(deltaTime) {
        this.x += this.speedX * deltaTime / 1000;
        this.y += this.speedY * deltaTime / 1000;
        if (this.x < 0 || this.x > r.WIDTH - this.size) this.speedX = -this.speedX;
        if (this.y < 0 || this.y > r.HEIGHT - this.size) this.speedY = -this.speedY;
    }

    draw(r) {
        r.fillRect(this.x, this.y, this.size, this.size, this.color);
    }
}

class Missile {
    constructor(x, y, targetX, targetY, speed) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.alive = true;
    }

    update(deltaTime) {
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.x += Math.cos(angle) * this.speed * deltaTime / 1000;
        this.y += Math.sin(angle) * this.speed * deltaTime / 1000;

        if (Math.hypot(this.targetX - this.x, this.targetY - this.y) < 5) {
            this.alive = false;
            explosions.push(new Explosion(this.targetX, this.targetY, 30, 500)); // Example explosion size and duration
        }
    }

    draw(r) {
        r.line(r.WIDTH / 2, r.HEIGHT, this.x, this.y, 22); // Color 22 for the missile line
    }
}

class Explosion {
    constructor(x, y, radius, duration) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.duration = duration;
        this.elapsed = 0;
        this.alive = true;
    }

    update(deltaTime) {
        this.elapsed += deltaTime;
        if (this.elapsed > this.duration) {
            this.alive = false;
        }
    }

    draw(r) {
        const progress = this.elapsed / this.duration;
        r.fillCircle(this.x, this.y, this.radius * progress, 22); // Color 22 for the explosion
    }

    affects(enemy) {
        const distance = Math.hypot(this.x - enemy.x, this.y - enemy.y);
        return distance < this.radius;
    }
}

let enemies = [];
let missiles = [];
let explosions = [];
let lastSpawnTime = Date.now();
let spawnInterval = 1000; // Spawn new enemy every second
let lastFrameTime = 0;

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

    window.t = 1;

    sounds = {};
    soundsReady = 0;
    totalSounds = 8;
    audioTxt = "";
    debugText = "";
    gamestate = 0;
    started = false;
    entitiesArray = [];
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

        // Update enemies
        enemies.forEach(enemy => {
            enemy.update(deltaTime);
        });

        // Update missiles
        missiles.forEach(missile => missile.update(deltaTime));
        missiles = missiles.filter(missile => missile.alive);

        // Update explosions
        explosions.forEach(explosion => explosion.update(deltaTime));
        explosions = explosions.filter(explosion => explosion.alive);

        // Handle collisions
        explosions.forEach(explosion => {
            enemies = enemies.filter(enemy => !explosion.affects(enemy));
        });

        // Spawn new enemy every second
        if (Date.now() - lastSpawnTime > spawnInterval) {
            lastSpawnTime = Date.now();
            enemies.push(new Enemy(
                Math.random() * (r.WIDTH - 20),
                Math.random() * (r.HEIGHT - 20),
                20,
                Math.random() * 100 - 50,
                Math.random() * 100 - 50,
                2 // Color for enemies
            ));
        }
    }

    function drawGame() {
        r.clear(64, r.SCREEN);

        // Draw enemies
        enemies.forEach(enemy => enemy.draw(r));

        // Draw missiles
        missiles.forEach(missile => missile.draw(r));

        // Draw explosions
        explosions.forEach(explosion => explosion.draw(r));

        // Draw timer
        countdownLoop();

        // Draw debug text
        let debugText = `ENEMIES: ${enemies.length}, MISSILES: ${missiles.length}, EXPLOSIONS: ${explosions.length}`;
        r.text(debugText, 10, 10, 1, 1, 'left', 'top', 1, 22);

        r.render();
    }

    function titlescreen() {
        r.clear(64, r.SCREEN);

        //draw a box 4x4 of each color 0 thru 63 across the bottom of the screen
        for (let i = 0; i < 64; i++) {
            r.fillRect(i * 7, 250, 7, 8, i);
        }
        r.renderSource = r.SCREEN;
        drawEntities(entitiesArray);
        let txt = "COUNTDOWN COMMAND";
        r.text(txt, w / 2 - 2, 100, 1, 1, 'center', 'top', 3, 22);
        txt = "CLICK TO START";
        r.text(txt, w / 2 - 2, 120, 1, 1, 'center', 'top', 1, 22);
        countdownLoop();
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
        drawDemoThings();
        r.text(audioTxt, w / 2 - 2, 100, 1, 1, 'center', 'top', 1, 22);
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
            case 1:
                missiles.push(new Missile(r.WIDTH / 2, r.HEIGHT, x, y, 300)); // Launch a missile
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

    function countdownLoop() {
        const targetDate = new Date('August 13, 2024 6:00:00').getTime();
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
        const color = 13; // White color

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
    }

    function gameloop(timestamp) {
        const deltaTime = timestamp - lastFrameTime;
        lastFrameTime = timestamp;

        if (1 == 1) {
            //stats.begin();
            switch (gamestate) {
                case 0:
                    preload();
                    updateGame(deltaTime);
                    break;
                case 1: //game
                    updateGame(deltaTime);
                    drawGame(r);
                    break;
                case 2:
                    updateGame(deltaTime);
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

    function drawDemoThings() {
        //draw a box 4x4 of each color 0 thru 63 across the bottom of the screen
        for (let i = 0; i < 64; i++) {
            r.fillRect(i * 7, 220, 7, 50, i);
        }
        //draw some r.LCG pseudo-random filled circles moving across the color bar
        r.LCG.state = 0xdeadbeef;
        for (let i = 0; i < 128; i++) {
            r.pat = r.dither[r.LCG.coinFlip() ? 0 : 16];
            r.fillCircle(r.LCG.randomInt(-480, 480) + (t/60 / (2 + r.LCG.randomInt(0, 6))) % w * 2, r.LCG.randomInt(220, 270), r.LCG.randomInt(4, 15), 66);
        }
        r.pat = r.dither[0];
        //use each drawing function to prevent treeshake, test size
        r.fillRect(10, 10, 10, 10, 22);
        r.fillCircle(30, 15, 5, 22);
        r.line(40, 10, 50, 20, 22);
        r.fillTriangle({ x: 60, y: 10 }, { x: 70, y: 20 }, { x: 60, y: 20 }, 22);
        r.text("ABCDEFGABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_!@#.'\"?/<()", 80, 10, 1, 1, 'left', 'top', 1, 22);

        let angle = t/60 % 360;
        //gradient squares with rotating fills, red, yellow and green
        r.gradRect(10, 40, 50, 50, 3, 5, angle);
        r.gradRect(70, 40, 50, 50, 7, 9, (angle + 45) % 360);
        r.gradRect(140, 40, 50, 50, 11, 13, (angle + 90) % 360);

        //"shade" drawing over the top of the gradient squares.
        //color indices 65 - 70 are special "shade" colors that darken the color underneath.
        r.gradRect(10, 60, 200, 50, 66, 69, 90)

        //draw the entire tile palette to top middle
        r.sspr(0, 0, 64, 72, 200, 30, 64, 72, false, false);

        //tile asset test
        r.drawTileAsset(0, 110, platformerTest);
        //shade sky at top 1 shade darker
        r.fillRect(0, 110, 480, 100, 66, 64, 8);

        //polygon test
        r.polygon(240, 160, 30, 7, t / 600, 22);

        //polyfill test
        //array of points for a 5 pointed star
        let points = [
            { x: 0, y: 0 },
            { x: 10, y: 30 },
            { x: 40, y: 30 },
            { x: 20, y: 50 },
            { x: 30, y: 80 },
            { x: 0, y: 60 },
            { x: -30, y: 80 },
            { x: -20, y: 50 },
            { x: -40, y: 30 },
            { x: -10, y: 30 },
        ];

        r.polyfill(100, 100, points, 22, 22);

        //fill a field with random tiles and colors
        r.LCG.state = 0xdeadbeef + Math.floor(t / 100 /60);
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 8; j++) {
                r.drawTile(r.LCG.randomInt(0, 63), 280 + i * 8, 30 + j * 8, r.LCG.randomInt(1, 63), r.LCG.randomInt(1, 63), r.LCG.coinFlip(), r.LCG.coinFlip());
            }
        }
        r.pat = r.dither[0];

    }

})();
