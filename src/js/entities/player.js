import { tileCollisionCheck, rectangle, lightRadial, playSound, randFloat, rand } from "../core/utils";
// import Arm from "./arm";
import Particle from "./particle";
import Bullet from "./bullet";
export default class P {

    constructor(x, y) {
        this.width = 4;
        this.height = 4; 
        this.oldX = x;
        this.oldY = y;
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.alive = true;
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.drag = 0.8;
        this.speed = 0.6;
        this.maxSpeed = 0.9;
        this.isFiring = false;
        this.gremlinBlood = 0;
        this.gremlinBloodMax = 200;
        this.currentRoom = null;
        this.health = 200;
        this.maxHealth = 200;
        this.completeAltars = [];
        this.stepFrameCount = 0;
        this.rectangle = new rectangle(this.x, this.y, this.width, this.height);
        this.bodyColor = 22;
        this.attackBoxColor = 8;
        this.attackDamage = 10;
        this.attackCoolDown = 5; // Number of frames before the player can attack again
        this.attackCoolDownCounter = 0; // Counter for the cooldown
        this.bombCoolDown = 30;
        this.bombCoolDownCounter = 0;
        this.hurtCoolDown = 60; // Number of frames before the player can be hurt again
        this.healCoolDown = 180;
        this.attackBox = new rectangle(this.x, this.y, 0, 0);; // Placeholder for the attack box
    }

    update() {
        //set angle by getting angle between mouse and player
        this.gremlinBlood = Math.min(this.gremlinBlood, this.gremlinBloodMax);
        this.angle = Math.atan2(mouse.y - (this.y-view.y), mouse.x - (this.x-view.x));
        if(this.health <= 0){
            gameOver = true;
            playSound(sounds.playerDeath);
        }
        this.oldX = this.x;
        this.oldY = this.y;

        this.velocity.x += this.acceleration.x;
        this.velocity.x *= this.drag;
        this.x += this.velocity.x;
        if (tileCollisionCheck(map, this)) {
            this.x = this.oldX;
        }

        this.velocity.y += this.acceleration.y;
        this.velocity.y *= this.drag;
        this.y += this.velocity.y;
        if (tileCollisionCheck(map, this)) {
            this.y = this.oldY;
        }

         //if moving increment stepFrameCount
         if(this.x !== this.oldX || this.y !== this.oldY) {
            this.stepFrameCount++;
        }
    
        // Handle attack cooldown and duration
        if (this.attackCoolDownCounter > 0) {
            this.attackCoolDownCounter--;
        }
        if (this.bombCoolDownCounter > 0) {
            this.bombCoolDownCounter--;
        }

        if (this.attackDurationCounter > 0) {
            this.attackDurationCounter--;
            this.isFiring = true;
        } else {
            this.isFiring = false;
        }

        this.acceleration.x = 0;
        this.acceleration.y = 0;

        this.rectangle.x = this.x;
        this.rectangle.y = this.y;

    }

    draw(r, view) {
        //draw basic stick legs, alternating every 8 frames
        if(this.stepFrameCount % 16 < 8) {
            r.line(this.x - view.x, this.y - view.y + 4, this.x - view.x, this.y - view.y + 8, this.bodyColor);
            r.line(this.x - view.x + 3, this.y - view.y + 4, this.x - view.x + 3, this.y - view.y + 8, this.bodyColor);
        } else {
            r.line(this.x - view.x, this.y - view.y + 4, this.x - view.x + 3, this.y - view.y + 8, this.bodyColor);
            r.line(this.x - view.x + 3, this.y - view.y + 4, this.x - view.x, this.y - view.y + 8, this.bodyColor);
        }

        // Draw body (with head and attack box)
        r.fRect(this.x - view.x, this.y - view.y-4, this.width, 8, this.bodyColor);
        //r.drawTile(5, this.x - view.x, this.y - view.y - 8, 16, 22, 8);
        r.sspr(16, 0, 16, 16, this.x - 2 - view.x, this.y - view.y - 8, 8, 8, 0, 0);        
        lightRadial(this.x - view.x + 2, this.y - view.y + 2, 50, [0,1,2,3,4]);


        //if completed altar torches >= 13, draw an arrow pointing towards the portal orbiting the Player
        if(this.sumCompletedTorches() >= 13) {
            let dx = portalLocation.x * tileSize - this.x;
            let dy = portalLocation.y * tileSize - this.y;
            let angle = Math.atan2(dy, dx);
            let x = this.x + Math.cos(angle) * 20;
            let y = this.y + Math.sin(angle) * 20;
            r.polygon(x - view.x, y - view.y, 5, 3, angle, 11, 11)
        }

        if(this.angle){
            let x = this.x + Math.cos(this.angle) * 20;
            let y = this.y + Math.sin(this.angle) * 20;
            r.polygon(x - view.x, y - view.y, 3, 3, this.angle, 4, 4)
        }
    }

    handleInput(Key) {
        if (Key.isDown(Key.LEFT) || Key.isDown(Key.a) || Key.isDown(Key.q)) {
            this.acceleration.x = -this.speed;
        } else if (Key.isDown(Key.RIGHT) || Key.isDown(Key.d)) {
            this.acceleration.x = this.speed;
        }
        if (Key.isDown(Key.UP) || Key.isDown(Key.w) || Key.isDown(Key.z)) {
            this.acceleration.y = -this.speed;
        } else if (Key.isDown(Key.DOWN) || Key.isDown(Key.s)) {
            this.acceleration.y = this.speed;
        }

        // Check if the attack button is pressed and if not on cooldown
        if (Key.isDown(Key.n) && this.attackCoolDownCounter <= 0) {
            this.attackDurationCounter = this.attackDuration; // Reset attack duration counter
            this.attackCoolDownCounter = this.attackCoolDown; // Start cooldown counter
        }

        if (Key.isDown(Key.x) && this.attackCoolDownCounter <= 0) {
            this.attackDurationCounter = this.attackDuration; // Reset attack duration counter
            this.attackCoolDownCounter = this.attackCoolDown; // Start cooldown counter
        }

        if ( (Key.justReleased(Key.c) || Key.justReleased(Key.m) ) && this.gremlinBlood > 10) {
            this.bomb();
        }

        //debug keys
        if(Key.justReleased(Key.ONE)){
            this.health += 100;
            this.completeAltars = [6,7];
        }
        // if(Key.justReleased(Key.TWO)){
        //     this.completeAltars = [3, 3, 3, 4];
        // }
        // if(Key.justReleased(Key.THREE)){
        //     this.completeAltars = [5, 3, 5];
        // }
        // if(Key.justReleased(Key.FOUR)){
        //     this.completeAltars = [0];
        //     this.gremlinBlood += 100;
        // }
        if(Key.justReleased(Key.FIVE)){
            currentFloor = 12;
        }

        if(mouse.down && this.attackCoolDownCounter <= 0){
            this.attackCoolDownCounter = this.attackCoolDown; 
            this.fireBullet();
        }

    }

    handleGamepadInput(gamepad) {
        // Handle movement
        const deadzone = 0.2;
        const x = gamepad.axes[0];
        const y = gamepad.axes[1];
        if (Math.abs(x) > deadzone) {
            this.acceleration.x = x * this.speed;
        }
        if (Math.abs(y) > deadzone) {
            this.acceleration.y = y * this.speed;
        }
        const bombPressed = (
            gamepad.buttons[1].pressed ||
            gamepad.buttons[5].pressed ||
            gamepad.buttons[7].pressed ||
            gamepad.buttons[1].pressed 
        );
        // Handle attack
        if (bombPressed && this.bombCoolDownCounter <= 0 && this.gremlinBlood > 10) {
            this.bombCoolDownCounter = this.bombCoolDown;
            this.bomb();
        }

        //fire bullets in direction of right stick
        const rightStickX = gamepad.axes[2];
        const rightStickY = gamepad.axes[3];

        if (Math.abs(rightStickX) > deadzone || Math.abs(rightStickY) > deadzone) {
            if(this.attackCoolDownCounter <= 0){
                this.angle = Math.atan2(rightStickY, rightStickX);
                this.attackCoolDownCounter = this.attackCoolDown; 
                this.fireBullet();
            }
        }
    }

    handleClick(e){
        if(e.which == 3){
            if(this.bombCoolDownCounter <= 0 && this.gremlinBlood > 10){ 
                this.bombCoolDownCounter = this.bombCoolDown;
                this.bomb();
            }
        }
        if(e.which == 1){
            this.fireBullet();
        }
    }

    handleMouseDown(){
        if(mouse.down && this.attackCoolDownCounter <= 0){
            this.attackCoolDownCounter = this.attackCoolDown; 
            this.fireBullet();
        }
    }

    fireBullet(){
        playSound(sounds.playerHurt, 1.5, 0, 0.1, false);
        bulletsArray.push(new Bullet(this.x, this.y, this.angle));
    }

    bomb(){
        //all gremlins in attack radius take 30 damage
        let attackRadius = 150;
        gremlinsArray.forEach(gremlin => {
            let dx = gremlin.x - this.x;
            let dy = gremlin.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < attackRadius) {
                gremlin.hurt(30);
            }
        });
        //spawn particles inside blast radius
        for(let i = 0; i < 400; i++) {
            let angle = Math.random() * Math.PI * 2;
            let x = this.x + Math.cos(angle) * rand(0,attackRadius);
            let y = this.y + Math.sin(angle) * rand(0,attackRadius);
            entitiesArray.push(new Particle(x, y, randFloat(-0.3,0.3), -0.75, {
                color: [22,9,10,11,12,13,14,15],
                life: 100,
                customUpdate: (particle) => {
                    particle.yVelocity += randFloat(-0.5, 0.5);
                    particle.xVelocity += randFloat(-0.5, 0.5);
                }
                }));
            
            lightRadial(x, y, 10);
        }
        this.gremlinBlood -= 10;
        playSound(sounds.playerAttack, 0.5, 0, 0.7)
        playSound(sounds.playerDeath, 0.5, 0, 0.7);
    }

    sumCompletedTorches() { return this.completeAltars.reduce((a, b) => a + b, 0); }

}
