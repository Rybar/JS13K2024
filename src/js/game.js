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
import platformerTest from '../assets/platformerTest.js';
import { get } from 'browser-sync';
import background1 from '../assets/background1.js';

class Enemy {
    constructor(x, y, size, speedX, speedY, color, seed) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
        this.alive = true;
        this.seed = seed;
        this.maxSpeed = 100;
        // Set the LCG state with the provided seed
        r.LCG.state = seed;

        // Generate random shapes within the bounds
        this.shapes = this.generateShapes();
    }

    generateShapes() {
        const shapes = [];
        const numShapes = r.LCG.randomInt(10, 20); // Random number of shapes between 5 and 10

        for (let i = 0; i < numShapes; i++) {
            const shapeType = r.LCG.randomInt(0, 1) === 0 ? 'rect' : 'circle';
            const posX = r.LCG.randomInt(0, this.size / 1.25);
            const posY = r.LCG.randomInt(0, this.size);
            const width = r.LCG.randomInt(0, this.size);
            const height = r.LCG.randomInt(0, this.size);
            const radius = r.LCG.randomInt(0, this.size / 4);
            const patternChoice = r.LCG.randomInt(0,2)
            const pattern = [0b1010101010101010,0b1111111111111111][patternChoice];
            const colorMod = r.LCG.randomInt(-3, 3);

            shapes.push({ shapeType, posX, posY, width, height, radius, pattern, colorMod });
        }

        return shapes;
    }

    update(deltaTime) {
        this.speedX += r.LCG.randomInt(-10, 10);
        this.speedY += r.LCG.randomInt(-10, 10);
        //cap speed between -100 and 100
        this.speedX = Math.min(this.maxSpeed, Math.max(-this.maxSpeed, this.speedX));
        this.speedY = Math.min(this.maxSpeed, Math.max(-this.maxSpeed, this.speedY));
        this.x += this.speedX * deltaTime / 1000;
        this.y += this.speedY * deltaTime / 1000;
        if (this.x < 0 || this.x > r.WIDTH - this.size) this.speedX = -this.speedX;
        if (this.y < 0 || this.y > r.HEIGHT - this.size) this.speedY = -this.speedY;
    }

    draw(r) {
        const halfSize = this.size / 2;

        // Draw the mirrored shapes
        this.shapes.forEach(shape => {
            const color = this.color;
            r.pat = shape.pattern;
            if (shape.shapeType === 'rect') {
                // Left side
                r.rect(this.x + shape.posX, this.y + shape.posY, shape.width, shape.height, color + shape.colorMod);
                // Mirrored right side
                r.rect(this.x + this.size - shape.posX - shape.width, this.y + shape.posY, shape.width, shape.height, color + shape.colorMod);
            } else if (shape.shapeType === 'circle') {
                // Left side
                r.circle(this.x + shape.posX + shape.radius, this.y + shape.posY, shape.radius, color + shape.colorMod);
                // Mirrored right side
                r.circle(this.x + this.size - shape.posX - shape.radius, this.y + shape.posY, shape.radius, color + shape.colorMod);
            }
        });
        r.pat = 0b1111111111111111;
        // Draw a border to emphasize the enemy's bounds
        //r.rect(this.x, this.y, this.size, this.size, this.color);
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
            explosions.push(new Explosion(this.targetX, this.targetY, 70, 600)); 
            playSound(sounds.boom1, 1, 0, 1, false);
        }
    }

    draw(r) {
        r.line(r.WIDTH / 2, r.HEIGHT, this.x, this.y, rand(5,63)); // Color 22 for the missile line
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
        //set dither pattern based on progress
        r.pat = r.dither[Math.floor(progress * 16)];
        r.fillCircle(this.x, this.y, this.radius * progress, choice([4,5,6,7,8,9,22])); 
        r.pat = 0b1111111111111111;
    }

    affects(enemy) {
        const progress = this.elapsed / this.duration;
        const enemyRadius = enemy.size / 2;
        const distance = Math.hypot(this.x - enemy.x - enemyRadius, this.y - enemy.y - enemyRadius);
        const hit = distance < this.radius * progress;
        if (hit) {
            entitiesArray.push(new Splode(enemy.x, enemy.y, 60, choice([22,23,24,25,26,27,28])));
            playSound(sounds.boom1, 1, 0, 1, false);
        }
        return hit;
    }
}

let enemies = [];
let missiles = [];
let explosions = [];
let lastSecondSpawnTime = Date.now();
let last10SecondsSpawnTime = Date.now();
let lastMinuteSpawnTime = Date.now();
let lastHourSpawnTime = Date.now();
let lastDaySpawnTime = Date.now();

let spawn10thofasecond = 100;
let spawnEachSecond = 1000; // Spawn new enemy every second
let spawnEach10Seconds = 10000;
let spawnEachMinute = 60000;
let spawnEachHour = 3600000;
let spawnEachDay = 86400000;


(function () {
    document.body.style = "margin:0; background-color:black; overflow:hidden";
    const w = 480, h = 270;
    window.w = w; window.h = h;
    let x = w / 2; let y = 36;
    const spawnLocations = {
        //these are same as the text locations, but for the spawn locations of the enemies
        day: { x: x - 140, y: y + 24 },
        hour: { x: x - 70, y: y + 24 },
        minute: { x: x, y: y + 24 },
        second: { x: x + 70, y: y + 24 },
        tenthOfASecond: { x: x + 140, y: y + 24 }
    }
let lastFrameTime = 0;
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

        entitiesArray.forEach(entity => entity.update());

        // Spawn new enemy every second
        if (Date.now() % spawnEachSecond > spawnEachSecond - deltaTime) {
            enemies.push(new Enemy(
                spawnLocations.second.x,
                spawnLocations.second.y,
                20,
                Math.random() * 100 - 50,
                Math.random() * 100 + 30,
                rand(5,63), 
                Math.floor(Math.random() * 0xFFFFFFFF)
            ));
            entitiesArray.push(new Splode(spawnLocations.second.x, spawnLocations.second.y, 60, 5));
            playSound(sounds.spawn, 1, 0, 1, false);
        }

        // Spawn a ton of enemies every 10 seconds
        if (Date.now() % spawnEach10Seconds > spawnEach10Seconds - deltaTime) {
            let i = 30; 
            while(i--) {
                enemies.push(new Enemy(
                    spawnLocations.second.x,
                    spawnLocations.second.y,
                    6,
                    Math.random() * 100 - 50,
                    Math.random() * 100 + 10,
                    rand(5,63), 
                    Math.floor(Math.random() * 0xFFFFFFFF)
                ));
            }
            entitiesArray.push(new Splode(spawnLocations.second.x, spawnLocations.second.y, 150, 8));
            playSound(sounds.spawn, 1, 0, 1, false);

        }

        if (Date.now() % spawnEachMinute > spawnEachMinute - deltaTime) {
            let i = 90; 
            while(i--) {
                enemies.push(new Enemy(
                    spawnLocations.minute.x,
                    spawnLocations.minute.y,
                    6,
                    Math.random() * 100 - 50,
                    Math.random() * 100,
                    rand(5,63), 
                    Math.floor(Math.random() * 0xFFFFFFFF)
                ));
            }
            entitiesArray.push(new Splode(spawnLocations.minute.x, spawnLocations.minute.y, 200, 9));
            playSound(sounds.spawn, 1, 0, 1, false);

        }
    }

    function drawGame() {
        r.clear(64, r.SCREEN);

        // Draw background
        r.pat = 0b1111111111111111;
        r.drawTileAsset(0, 50, background1);

       

        // Draw enemies
        enemies.forEach(enemy => enemy.draw(r));

        // Draw missiles
        missiles.forEach(missile => missile.draw(r));

        // Draw explosions
        explosions.forEach(explosion => explosion.draw(r));

        drawEntities(entitiesArray);

        //draw color bar
        for (let i = 0; i < 64; i++) {
        r.fillRect(i * w/64, 0, w/64, 50, i + t/60);
        }
        r.fillRect(0, 8, w, 36, 66, 67, 8);
        // Draw timer
        countdownLoop();
        
        // Draw debug text
        let debugText = `BUGS IN THE FIELD: ${enemies.length}`;
        r.text(debugText, 10, 260, 1, 1, 'left', 'top', 1, 22);

        r.render();
    }

    function titlescreen() {
        r.clear(64, r.SCREEN);

        r.drawTileAsset(0, 0, background1);
        drawEntities(entitiesArray);
        let txt = "COUNTDOWN COMMANDO";
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



        drawDemoThings();

        let txt = "COUNTDOWN COMMANDO";
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
            case 1:
                missiles.push(new Missile(r.WIDTH / 2, r.HEIGHT, x, y, 600)); // Launch a missile
                playSound(sounds.missileWhoosh, 1, 0, 1, false);
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
        const targetDate = new Date(Date.UTC(2024, 7, 13, 11, 0, 0))
        const now = getZuluTime();
        const distance = targetDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        const milliseconds = distance % 1000;

        // Display the countdown text
        const x = w / 2;
        const y = 36;
        const hspacing = 1;
        const vspacing = 3;
        const scaleLarge = 4;
        const scaleSmall = 1;
        const color = 22; 

        r.pat = 0b0000100010000000;
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

       
        //r.pat=0b1111111111111111;
    }

    function getZuluTime() {
        const now = new Date(); // Client's local time
        const localTime = now.getTime(); // Local time in milliseconds
        const timezoneOffset = now.getTimezoneOffset() * 60000; // Offset in milliseconds
    
        const zuluTime = new Date(localTime + timezoneOffset);
        return zuluTime;
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

    function drawDemoThings() {
        t += 1000/60; 
        //tile asset test, background
        r.drawTileAsset(0, 0, background1);
        r.fillRect(0,0,480,20,64);
        for (let i = 0; i < 64; i++) {
            r.fillRect(i * (480/64), 0, w/64, 17, i);
        }
        r.fillRect(0, 5, 480, 7, 66, 67, 8)

        for (let i = 0; i < 64; i++) {
            r.fillRect(i * (480/64), 220, w/64, 50, i);
        }
        r.fillRect(0, 5, 480, 7, 66, 67, 8)
        //draw some r.LCG pseudo-random filled circles moving across the color bar
        r.LCG.state = 0xdeadbeef;
        for (let i = 0; i < 128; i++) {
            r.pat = r.dither[8];
            r.fillCircle(r.LCG.randomInt(-480, 480) + (t/3 / (2 + r.LCG.randomInt(0, 6))) % w * 2, r.LCG.randomInt(220, 270), r.LCG.randomInt(4, 15), 66,67);
        }
        r.pat = r.dither[0];

        //use each drawing function to prevent treeshake, test size
        let demox = 4, demoy = 6;
        r.fillRect(demox, demoy, 10, 10, 67);
        r.fillCircle(demox+20, demoy+5, 5, 67);
        r.line(demox+30, demoy, demox+40, demoy+10, 67);
        r.fillTriangle({ x: 50, y: demoy }, { x: 60, y: demoy+10 }, { x: 50, y: demoy+10 }, 67);
        r.text("RETROBUFFER API DEMO", 66, demoy+1, 1, 1, 'left', 'top', 1, 68);
        demoy = 4;
        r.fillRect(demox, demoy, 10, 10, 22);
        r.fillCircle(demox+20, demoy+5, 5, 22);
        r.line(demox+30, demoy, demox+40, demoy+10, 22);
        r.fillTriangle({ x: 50, y: demoy }, { x: 60, y: demoy+10 }, { x: 50, y: demoy+10 }, 22);
        r.text("RETROBUFFER API DEMO", 66, 6, 1, 1, 'left', 'top', 1, 22);

        let angle = t/20 % 360;
        //gradient squares with rotating fills, red, yellow and green
        r.gradRect(4, 20, 50, 32, 3, 5, angle);
        r.gradRect(70, 20, 50, 32, 7, 9, (angle + 45) % 360);
        r.gradRect(140, 20, 50, 32, 11, 13, (angle + 90) % 360);       

        //polygon test
        let px = 240, py = 50;
        for(let i = 0; i < 10; i++) {
            r.polygon(px, py, 20+i, i+2, t /(100*i), 9+i);
        }

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

        r.polyfill(100, 100, points, 65, 66);

        //fill a field with random tiles and colors
        r.LCG.state = 0xdeadbeef + Math.floor(t / 1000);
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 4; j++) {
                r.drawTile(r.LCG.randomInt(0, 63), 280 + i * 8, 30 + j * 8, r.LCG.randomInt(1, 63), r.LCG.randomInt(1, 63), r.LCG.coinFlip(), r.LCG.coinFlip());
            }
        }
        r.pat = 0b1111111111111111;

    }

})();
